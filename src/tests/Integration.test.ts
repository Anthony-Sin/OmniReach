import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoordinatorAgent, coordinatorAgent } from '../agents/CoordinatorAgent';
import * as geminiService from '../../services/geminiService';
import * as gdacsService from '../../services/gdacsService';
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

vi.mock('../lib/routePlanner', () => ({
  RoutePlanner: {
    generateRoute: vi.fn(),
  },
}));

// Mock RoboticsAgent since it requires simulation
vi.mock('../agents/RoboticsAgent', () => ({
  RoboticsAgent: {
    execute: vi.fn(async (missionId, payload, context) => {
      // Simulate start
      context.agent.sendMessage(AgentType.COORDINATOR, {
        missionId,
        sourceAgent: AgentType.ROBOTICS,
        type: MissionEventType.ARM_EXECUTION_STARTED,
        payload: { status: 'STARTING' },
        timestamp: Date.now(),
        traceId: 'trace-start',
        confidence: 1,
        status: 'SUCCESS',
        rationale: 'Starting execution'
      });
      
      // Simulate completion
      context.agent.sendMessage(AgentType.COORDINATOR, {
        missionId,
        sourceAgent: AgentType.ROBOTICS,
        type: MissionEventType.ARM_EXECUTION_COMPLETED,
        payload: { success: true, stepsCompleted: 5, totalSteps: 5, finalPose: [0,0,0], executionTime: 1000 },
        timestamp: Date.now(),
        traceId: 'trace-1',
        confidence: 1,
        status: 'SUCCESS',
        rationale: 'Execution completed'
      });
    }),
  },
}));

describe('Full Mission Integration', () => {
  const publishedTypes: string[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    publishedTypes.length = 0;
    CoordinatorAgent.init();
    coordinatorAgent.onMessage((msg) => {
      if (msg && msg.type) {
        publishedTypes.push(msg.type);
      }
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
      requiredResources: ['Standard Assembly Line']
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

    // 2. Start the chain
    const missionId = CoordinatorAgent.startNewMission();

    // 3. We need to wait for the events to propagate through the coordinator.
    // Since everything is mocked and async, we can use a small delay.
    await new Promise(resolve => setTimeout(resolve, 200));

    // 4. Verify the chain reached the end
    expect(publishedTypes).toContain('ALERT_DETECTED');
    expect(publishedTypes).toContain('ZONE_PRIORITIZED');
    expect(publishedTypes).toContain('KIT_PLAN_CREATED');
    expect(publishedTypes).toContain('PICK_SEQUENCE_CREATED');
    expect(publishedTypes).toContain('ARM_EXECUTION_STARTED');
    expect(publishedTypes).toContain('ARM_EXECUTION_COMPLETED');
    expect(publishedTypes).toContain('DELIVERY_ROUTE_CREATED');
    expect(publishedTypes).toContain('MISSION_COMPLETE');
  });
});
