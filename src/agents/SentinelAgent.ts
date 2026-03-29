
import { Agent, Tool } from '../lib/adk';
import { fetchGDACSEvents, GDACSEvent } from '../../services/gdacsService';
import { summarizeAlerts } from '../../services/geminiService';
import { createEvent, withRetry } from '../lib/agentUtils';
import { MissionEventType, NormalizedAlert, AlertDetectedPayload, AgentType } from '../types/mission';
import { SentinelInputSchema, SentinelOutputSchema } from '../types/adk';

export class SentinelAgent {
  private static lastSnapshot: NormalizedAlert[] = [];

  static reset() {
    this.lastSnapshot = [];
  }

  /**
   * Normalizes raw GDACS events into mission-friendly alerts.
   * Implements deterministic ranking based on alertlevel.
   */
  private static normalizeEvents(events: GDACSEvent[]): NormalizedAlert[] {
    return events.map(e => {
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      
      // Deterministic ranking rules
      switch (e.alertlevel?.toLowerCase()) {
        case 'red':
          severity = 'critical';
          break;
        case 'orange':
          severity = 'high';
          break;
        case 'green':
          severity = 'low';
          break;
        default:
          severity = 'medium';
      }

      return {
        id: `alert-${e.eventid}-${e.episodeid}`,
        eventid: e.eventid,
        episodeid: e.episodeid,
        type: e.eventtype,
        name: e.name,
        country: e.country,
        lat: e.lat,
        lng: e.lon,
        alertLevel: e.alertlevel,
        severity,
        description: e.description,
        timestamp: e.fromdate
      };
    });
  }

  /**
   * Deduplicates alerts by eventid and episodeid.
   */
  private static deduplicate(alerts: NormalizedAlert[]): NormalizedAlert[] {
    const seen = new Set<string>();
    return alerts.filter(a => {
      const key = `${a.eventid}-${a.episodeid}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  static async startMonitoring(missionId: string, context: any) {
    try {
      // 1. Ingest latest GDACS feed with retry across multiple alert levels.
      const rawEvents = await withRetry(
        async () => await fetchGDACSEvents(['red', 'orange', 'green']),
        3,
        1000
      );
      
      if (!rawEvents || rawEvents.length === 0) {
        throw new Error('GDACS feed returned no events across monitored alert levels.');
      }

      // 2. Normalize and Deduplicate
      const normalized = this.normalizeEvents(rawEvents);
      const uniqueAlerts = this.deduplicate(normalized);

      // 3. Save the latest snapshot for diagnostics only.
      this.lastSnapshot = uniqueAlerts;

      // 4. Use Gemini for concise reasoning summary (retries handled in geminiService)
      const summary = await summarizeAlerts(uniqueAlerts);

      // 5. Emit ALERT_DETECTED
      this.emitAlerts(missionId, uniqueAlerts, summary, 0, context);

    } catch (error: any) {
      console.error('SentinelAgent Error:', error);
      
      const failEvent = createEvent(
        missionId,
        AgentType.SENTINEL,
        MissionEventType.MISSION_FAILED,
        { 
          reason: 'SentinelAgent failed to ingest or process disaster feeds after multiple attempts.',
          failedAgent: AgentType.SENTINEL,
          errors: [error.message],
          canRetry: true
        },
        { 
          status: 'ERROR',
          errors: [error.message],
          rationale: 'SentinelAgent failed to ingest or process disaster feeds after multiple attempts.'
        }
      );
      context.agent.sendMessage(AgentType.COORDINATOR, failEvent);
    }
  }

  private static emitAlerts(missionId: string, alerts: NormalizedAlert[], summary: string, retryCount: number, context: any) {
    const payload: AlertDetectedPayload = {
      alerts,
      summary,
      count: alerts.length,
      evidence: {
        source: 'GDACS API',
        lastSnapshotId: alerts.length > 0 ? alerts[0].id : undefined
      }
    };

    const event = createEvent(
      missionId,
      AgentType.SENTINEL,
      MissionEventType.ALERT_DETECTED,
      payload,
      { 
        confidence: 0.95,
        rationale: summary,
        retryCount
      }
    );

    // ADK A2A: Send message to Coordinator
    context.agent.sendMessage(AgentType.COORDINATOR, event);
  }
}

export const sentinelTool = new Tool({
  name: 'startMonitoring',
  description: 'Starts monitoring GDACS for alerts for a given mission.',
  inputSchema: SentinelInputSchema,
  outputSchema: SentinelOutputSchema,
  run: async ({ missionId }, context) => {
    await SentinelAgent.startMonitoring(missionId, context);
    return { success: true };
  }
});

export const sentinelAgent = new Agent({
  name: AgentType.SENTINEL,
  description: 'Monitors GDACS for disaster alerts and normalizes them.',
  tools: [sentinelTool]
});
