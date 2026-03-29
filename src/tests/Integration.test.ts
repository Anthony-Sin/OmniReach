import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoordinatorAgent, coordinatorAgent } from '../agents/CoordinatorAgent';
import { RoboticsAgent } from '../agents/RoboticsAgent';
import * as geminiService from '../../services/geminiService';
import * as gdacsService from '../../services/gdacsService';
import * as weatherService from '../../services/weatherService';
import * as actionService from '../../services/actionService';
import * as reliefWebService from '../../services/reliefWebService';
import * as usgsFloodService from '../../services/usgsFloodService';
import { RoutePlanner } from '../lib/routePlanner';
import { MissionEventType, AgentType } from '../types/mission';

// Mock services
vi.mock('../../services/geminiService', () => ({
  summarizeAlerts: vi.fn(),
  rankGDACSEvents: vi.fn(),
  getKitRecommendation: vi.fn(),
  explainLogisticsSequence: vi.fn(),
  generateRouteNarrative: vi.fn(),
}));

vi.mock('../../services/gdacsService', () => ({
  fetchGDACSEvents: vi.fn(),
}));

vi.mock('../../services/weatherService', () => ({
  fetchWeather: vi.fn(),
}));

vi.mock('../../services/actionService', () => ({
  exportIncidentPacket: vi.fn(),
  dispatchPartnerWebhook: vi.fn(),
}));

vi.mock('../../services/reliefWebService', () => ({
  fetchReliefWebContext: vi.fn(),
}));

vi.mock('../../services/usgsFloodService', () => ({
  fetchUsgsFloodContext: vi.fn(),
}));

vi.mock('../lib/routePlanner', () => ({
  RoutePlanner: {
    generateRoute: vi.fn(),
  },
}));

describe('Full Mission Integration', () => {
  const publishedTypes: string[] = [];
  const publishedEvents: { missionId: string; type: string }[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    publishedTypes.length = 0;
    publishedEvents.length = 0;
    CoordinatorAgent.init();
    coordinatorAgent.onMessage((msg) => {
      if (msg && msg.type && msg.missionId) {
        publishedTypes.push(msg.type);
        publishedEvents.push({ missionId: msg.missionId, type: msg.type });
      }
    });

    vi.spyOn(RoboticsAgent, 'execute').mockImplementation(async (missionId, payload, context) => {
      context.agent.sendMessage(AgentType.COORDINATOR, {
        missionId,
        sourceAgent: AgentType.ROBOTICS,
        type: MissionEventType.ARM_EXECUTION_STARTED,
        payload: {
          armId: 'arm-1',
          plan: payload,
          startPose: [0, 0, 0.45],
          targetPoses: payload.steps.map((step: any) => step.target),
          safetyChecks: payload.safetyNotes,
          rollbackPlan: 'Return to home position'
        },
        timestamp: Date.now(),
        traceId: 'trace-start',
        confidence: 1,
        status: 'SUCCESS',
        rationale: 'Starting execution'
      });

      context.agent.sendMessage(AgentType.COORDINATOR, {
        missionId,
        sourceAgent: AgentType.ROBOTICS,
        type: MissionEventType.ARM_EXECUTION_COMPLETED,
        payload: { success: true, stepsCompleted: 5, totalSteps: 5, finalPose: [0, 0, 0], executionTime: 1000 },
        timestamp: Date.now(),
        traceId: 'trace-1',
        confidence: 1,
        status: 'SUCCESS',
        rationale: 'Execution completed'
      });
    });
  });

  it('should complete a full mission chain from alert to delivery', async () => {
    // 1. Setup Mocks
    (gdacsService.fetchGDACSEvents as any).mockResolvedValue([{ 
      eventid: 1,
      episodeid: 1,
      eventtype: 'Flood',
      name: 'Flood',
      country: 'Test',
      lat: 10, 
      lon: 20, 
      alertlevel: 'red',
      description: 'Flood',
      fromdate: new Date().toISOString()
    }]);
    (geminiService.summarizeAlerts as any).mockResolvedValue('Summary');
    (geminiService.rankGDACSEvents as any).mockResolvedValue([
      { eventid: 1, name: 'Zone A', priority: 1, lat: 10, lng: 20, reason: 'High impact' }
    ]);
    (geminiService.getKitRecommendation as any).mockResolvedValue({
      kitType: 'Hydration Kit',
      items: ['water_purification_tablets', 'collapsible_water_container'],
      assemblyOrder: ['water_purification_tablets', 'collapsible_water_container'],
      missingItems: [],
      priority: 'high',
      reasoning: 'Needed',
      requiredResources: ['Standard Assembly Line'],
      waypoints: [[0.5, 0, 0.3], [0.5, 0.1, 0.3], [0.5, -0.1, 0.3]]
    });
    (geminiService.explainLogisticsSequence as any).mockResolvedValue('Optimized');
    (geminiService.generateRouteNarrative as any).mockResolvedValue('Narrative');
    (RoutePlanner.generateRoute as any).mockReturnValue({
      waypoints: [[10, 20]],
      transportMode: 'DRONE',
      eta: 300,
      riskFlags: [],
      constraints: []
    });
    (weatherService.fetchWeather as any).mockResolvedValue({
      temperature: 20,
      windSpeed: 5,
      precipitation: 0,
      weatherCode: 0,
      riskLevel: 1,
      isHighRisk: false
    });
    (actionService.exportIncidentPacket as any).mockResolvedValue({
      exportPath: 'outbox/incidents/mission.json',
      partnerName: 'Local Emergency Operations',
      channels: ['INCIDENT_EXPORT']
    });
    (actionService.dispatchPartnerWebhook as any).mockResolvedValue({
      targetUrl: 'https://partner.example/webhook',
      deliveryStatus: 'DELIVERED',
      partnerName: 'Local Emergency Operations',
      responseCode: 200
    });
    (reliefWebService.fetchReliefWebContext as any).mockResolvedValue({
      count: 2,
      reports: [],
      summary: 'ReliefWeb found 2 recent humanitarian reports.'
    });
    (usgsFloodService.fetchUsgsFloodContext as any).mockResolvedValue({
      count: 1,
      observations: [],
      floodRiskScore: 3,
      summary: 'USGS found 1 nearby water observation.'
    });

    // 2. Start the chain
    await CoordinatorAgent.startNewMission();

    // 3. We need to wait for the events to propagate through the coordinator.
    // Since everything is mocked and async, we can use a small delay.
    await new Promise(resolve => setTimeout(resolve, 500));

    // 4. Verify the chain reached the end
    expect(publishedTypes).toContain('ALERT_DETECTED');
    expect(publishedTypes).toContain('ZONE_PRIORITIZED');
    expect(publishedTypes).toContain('KIT_PLAN_CREATED');
    expect(publishedTypes).toContain('PICK_SEQUENCE_CREATED');
    expect(publishedTypes).toContain('ARM_EXECUTION_STARTED');
    expect(publishedTypes).toContain('ARM_EXECUTION_COMPLETED');
    expect(publishedTypes).toContain('DELIVERY_ROUTE_CREATED');
    expect(publishedTypes).toContain('INCIDENT_EXPORT_CREATED');
    expect(publishedTypes).toContain('ACTION_HANDOFF_COMPLETED');
    expect(publishedTypes).toContain('MISSION_COMPLETE');

    const completedMissionIds = Array.from(new Set(
      publishedEvents
        .filter(event => event.type === 'MISSION_COMPLETE')
        .map(event => event.missionId)
    ));

    const handedOffMissionId = completedMissionIds.find(missionId => {
      const missionTypes = publishedEvents
        .filter(event => event.missionId === missionId)
        .map(event => event.type);
      return missionTypes.includes('ACTION_HANDOFF_COMPLETED');
    });

    expect(handedOffMissionId).toBeDefined();

    const handedOffMissionTypes = publishedEvents
      .filter(event => event.missionId === handedOffMissionId)
      .map(event => event.type);

    expect(handedOffMissionTypes.filter(type => type === 'MISSION_COMPLETE')).toHaveLength(1);
    expect(handedOffMissionTypes.indexOf('ACTION_HANDOFF_COMPLETED')).toBeLessThan(handedOffMissionTypes.indexOf('MISSION_COMPLETE'));
  });
});
