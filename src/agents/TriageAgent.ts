
import { Agent, Tool } from '../lib/adk';
import { rankGDACSEvents } from '../../services/geminiService';
import { createEvent } from '../lib/agentUtils';
import { MissionEventType, NormalizedAlert, MissionState, ZonePrioritizedPayloadSchema, KitSpecialization, AgentType } from '../types/mission';
import { FACILITY_LOCATION } from '../../constants';
import { TriageInputSchema, TriageOutputSchema } from '../types/adk';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function getSpecializationsForAlert(alert: any): KitSpecialization[] {
  const specs: KitSpecialization[] = [];
  const type = (alert.eventtype || alert.type || '').toLowerCase();
  const severity = alert.severity || 'medium';
  
  if (severity === 'critical') {
    specs.push(KitSpecialization.SEARCH_RESCUE);
    specs.push(KitSpecialization.MEDICAL);
  } else if (severity === 'high') {
    specs.push(KitSpecialization.MEDICAL);
    specs.push(KitSpecialization.WATER_SANITATION);
  } else if (type.includes('flood') || type.includes('cyclone') || type.includes('hurricane')) {
    specs.push(KitSpecialization.WATER_SANITATION);
    specs.push(KitSpecialization.FAMILY_SHELTER);
  } else {
    specs.push(KitSpecialization.FAMILY_SHELTER);
  }
  
  return Array.from(new Set(specs));
}

function normalizeZone(alert: any) {
  const rawType = String(alert.eventtype || alert.type || 'flood').toLowerCase();
  const rawSeverity = String(alert.severity || 'medium').toLowerCase();

  const typeMap: Record<string, 'flood' | 'earthquake' | 'conflict' | 'wildfire' | 'facility' | 'cyclone' | 'volcano' | 'drought'> = {
    flood: 'flood',
    earthquake: 'earthquake',
    conflict: 'conflict',
    wildfire: 'wildfire',
    facility: 'facility',
    cyclone: 'cyclone',
    hurricane: 'cyclone',
    typhoon: 'cyclone',
    volcano: 'volcano',
    drought: 'drought'
  };

  return {
    ...alert,
    id: alert.id ?? `gdacs-${alert.eventid ?? alert.name ?? 'zone'}`,
    type: typeMap[rawType] ?? 'flood',
    severity: ['low', 'medium', 'high', 'critical', 'nominal'].includes(rawSeverity) ? rawSeverity : 'medium',
    alertLevel: alert.alertLevel ?? alert.alertlevel ?? 'green'
  };
}

export class TriageAgent {
  static async prioritize(mission: MissionState, alerts: NormalizedAlert[], context: any) {
    const missionId = mission.id;
    const userSelectedZone = mission.data.selectedZone;
    
    let activeZoneIds: string[] = [];
    try {
      const response = await context.agent.runTool('queryActiveZones', { requestingMissionId: missionId }, { targetAgent: AgentType.COORDINATOR });
      activeZoneIds = response.activeZoneIds ?? [];
    } catch (e) {
      console.warn('[TriageAgent] Failed to query active zones from Coordinator via ADK:', e);
    }

    try {
      if (!alerts || alerts.length === 0) {
        throw new Error('No alerts provided for triage.');
      }

      // Broadcast thinking status
      context.agent.sendMessage(AgentType.COORDINATOR, createEvent(
        missionId,
        AgentType.TRIAGE,
        MissionEventType.AGENT_THINKING,
        { message: 'Scoring and ranking alerts using Haversine distance...' },
        { rationale: `Calculating proximity scores relative to ${FACILITY_LOCATION.name}.` }
      ));

      // 1. Deterministic Scoring
      let scoredAlerts: any[] = alerts.map(alert => {
        let score = 0;

        // Severity Score
        const severityWeights = { critical: 100, high: 70, medium: 40, low: 10 };
        score += severityWeights[alert.severity] || 0;

        // Proximity Score (inverse distance in KM)
        const dist = haversineKm(alert.lat, alert.lng, FACILITY_LOCATION.lat, FACILITY_LOCATION.lng);
        const proximityScore = 1000 / (10 + dist); // Max 100 points for proximity
        score += proximityScore;

        // User Selection Bonus
        if (userSelectedZone && (userSelectedZone.id === `gdacs-${alert.eventid}` || userSelectedZone.name === alert.name)) {
          score += 200; // Strong preference for user selection
        }

        // Active Mission Penalty (avoid duplication)
        const hasActiveMission = activeZoneIds.includes(`gdacs-${alert.eventid}`);
        if (hasActiveMission) {
          score -= 150; // Heavy penalty for already active zones
        }

        return { ...alert, triageScore: score, distance: dist, hasActiveMission };
      });

      try {
        const enrichment = await context.agent.runTool(
          'enrichAlerts',
          { missionId, alerts: scoredAlerts.slice(0, 5) },
          { targetAgent: AgentType.INTEL, queueName: 'intel-worker' }
        );

        const enrichedByEventId = new Map<number, any>(
          (enrichment?.enrichedAlerts ?? []).map((alert: any) => [alert.eventid, alert])
        );

        scoredAlerts = scoredAlerts.map((alert: any) => {
          const enriched = enrichedByEventId.get(alert.eventid);
          if (!enriched) return alert;

          const reliefBoost = Math.min((enriched.reliefWebCount ?? 0) * 2, 12);
          const floodBoost = Math.min((enriched.floodRiskScore ?? 0) * 3, 18);
          return {
            ...alert,
            ...enriched,
            triageScore: alert.triageScore + reliefBoost + floodBoost
          };
        });
      } catch (e) {
        console.warn('[TriageAgent] Failed to enrich alerts via IntelAgent:', e);
      }

      // Sort by score
      const sorted = scoredAlerts.sort((a, b) => b.triageScore - a.triageScore);
      
      // 2. AI-Enhanced Reasoning
      let reasoning = `Prioritized ${sorted[0].name} based on ${sorted[0].severity} severity and proximity.`;
      let ranked = sorted;

      // Gemini ranking with retry and validation (handled in geminiService)
      const aiResult = await rankGDACSEvents(alerts);
      
      if (Array.isArray(aiResult) && aiResult.length > 0) {
        ranked = aiResult.map((aiItem: any) => {
          const original = sorted.find(s => s.eventid === aiItem.eventid);
          return normalizeZone({ ...original, ...aiItem });
        });
        
        const aiTop = ranked[0] as any;
        if (aiTop.reasoning) {
          reasoning = aiTop.reasoning;
        }
      }

      ranked = ranked.map(normalizeZone);

      const selectedZone: any = ranked[0];
      const payload = { 
        zone: selectedZone,
        ranked, // Full list for UI
        priorityScore: Math.min((selectedZone.triageScore ?? 0) / 300, 1), // Normalized 0-1
        reason: reasoning,
        recommendedMissionMode: selectedZone.severity === 'critical' ? 'EMERGENCY' : 'STANDARD' as const,
        constraints: [
          `Distance: ${(selectedZone.distance ?? 0).toFixed(2)} km`,
          `Alert Level: ${selectedZone.alertLevel}`,
          selectedZone.reliefWebCount ? `ReliefWeb Reports: ${selectedZone.reliefWebCount}` : 'ReliefWeb Reports: 0',
          selectedZone.floodGaugeCount ? `USGS Flood Gauges: ${selectedZone.floodGaugeCount}` : 'USGS Flood Gauges: 0',
          selectedZone.severity === 'critical' ? 'Immediate response required' : 'Standard response protocol'
        ]
      };

      // Validate payload before emitting
      ZonePrioritizedPayloadSchema.parse(payload);

      // If this is a master mission (no kitSpecialization), trigger auto-deploy
      if (!mission.data.kitSpecialization) {
        const deployments = ranked.slice(0, 3).map(alert => ({
          zone: alert,
          specializations: getSpecializationsForAlert(alert)
        }));

        const autoDeployEvent = createEvent(
          missionId,
          AgentType.TRIAGE,
          MissionEventType.AUTO_DEPLOY_TRIGGERED,
          { deployments },
          { rationale: `Master mission detected. Triggering autonomous deployment for ${deployments.length} zones.` }
        );
        context.agent.sendMessage(AgentType.COORDINATOR, autoDeployEvent);

        // Mark master mission as complete since it has spawned its children
        const completeEvent = createEvent(
          missionId,
          AgentType.TRIAGE,
          MissionEventType.MISSION_COMPLETE,
          { 
            summary: `Autonomous response initiated. Enqueued ${deployments.reduce((acc, d) => acc + d.specializations.length, 0)} kit missions across ${deployments.length} prioritized zones.`,
            timestamps: { start: mission.data.startTime || Date.now(), end: Date.now() },
            successMetrics: { accuracy: 1, speed: 1, safety: 1 }
          },
          { rationale: 'Master mission monitoring and triage phase complete.' }
        );
        context.agent.sendMessage(AgentType.COORDINATOR, completeEvent);
        return;
      }

      const prioritizedEvent = createEvent(
        missionId,
        AgentType.TRIAGE,
        MissionEventType.ZONE_PRIORITIZED,
        payload,
        { rationale: reasoning }
      );
      context.agent.sendMessage(AgentType.COORDINATOR, prioritizedEvent);

    } catch (error: any) {
      console.error('TriageAgent Error:', error);
      const failEvent = createEvent(
        missionId,
        AgentType.TRIAGE,
        MissionEventType.MISSION_FAILED,
        { 
          reason: 'Critical failure in triage scoring or validation logic.',
          failedAgent: AgentType.TRIAGE,
          errors: [error.message],
          canRetry: true
        },
        { 
          status: 'ERROR',
          errors: [error.message],
          rationale: 'Critical failure in triage scoring or validation logic.'
        }
      );
      context.agent.sendMessage(AgentType.COORDINATOR, failEvent);
    }
  }
}

export const triageTool = new Tool({
  name: 'prioritize',
  description: 'Prioritizes disaster alerts based on severity and proximity.',
  inputSchema: TriageInputSchema,
  outputSchema: TriageOutputSchema,
  run: async ({ missionId, alerts }, context) => {
    // We need the mission state, which we can get from missionStore
    const { missionStore } = await import('../lib/missionStore');
    const mission = missionStore.getMission(missionId);
    if (mission) {
      await TriageAgent.prioritize(mission, alerts, context);
    }
    return { success: true };
  }
});

export const triageAgent = new Agent({
  name: AgentType.TRIAGE,
  description: 'Prioritizes disaster alerts using Haversine distance and AI reasoning.',
  tools: [triageTool]
});
