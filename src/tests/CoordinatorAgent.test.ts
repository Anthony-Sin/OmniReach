import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoordinatorAgent, coordinatorAgent } from '../agents/CoordinatorAgent';
import { MissionEventType, MissionProgress, AgentType } from '../types/mission';
import { missionStore } from '../lib/missionStore';

describe('CoordinatorAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear missions before each test
    missionStore.clearCompleted();
    (missionStore.missions as any).clear();
  });

  it('should handle ALERT_DETECTED and trigger TriageAgent', async () => {
    const runToolSpy = vi.spyOn(coordinatorAgent, 'runTool').mockResolvedValue({ success: true } as any);
    const mockEvent = {
      missionId: 'mission-1',
      agentId: 'SENTINEL',
      type: MissionEventType.ALERT_DETECTED,
      payload: { alerts: [{ id: '1', title: 'Flood', severity: 'High', location: { lat: 10, lng: 20 }, description: 'Flood' }] },
      timestamp: Date.now(),
      traceId: 'trace-1'
    };

    // Initialize mission
    missionStore.setMission('mission-1', {
      id: 'mission-1',
      progress: MissionProgress.MONITORING,
      currentStep: AgentType.SENTINEL,
      events: [],
      data: {}
    });

    await (CoordinatorAgent as any).handleEvent(mockEvent);

    expect(runToolSpy).toHaveBeenCalledWith(
      'prioritize',
      expect.objectContaining({ missionId: 'mission-1' }),
      { targetAgent: AgentType.TRIAGE, queueName: 'triage-worker' }
    );
  });

  it('should prevent duplicate processing of same event', async () => {
    const runToolSpy = vi.spyOn(coordinatorAgent, 'runTool').mockResolvedValue({ success: true } as any);
    const mockEvent = {
      missionId: 'mission-1',
      agentId: 'SENTINEL',
      type: MissionEventType.ALERT_DETECTED,
      payload: { alerts: [] },
      timestamp: Date.now(),
      traceId: 'trace-1'
    };

    // Initialize mission
    missionStore.setMission('mission-1', {
      id: 'mission-1',
      progress: MissionProgress.MONITORING,
      currentStep: AgentType.SENTINEL,
      events: [],
      data: {}
    });

    await (CoordinatorAgent as any).handleEvent(mockEvent);
    await (CoordinatorAgent as any).handleEvent(mockEvent);

    expect(runToolSpy).toHaveBeenCalledTimes(1);
  });
});
