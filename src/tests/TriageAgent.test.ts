import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TriageAgent } from '../agents/TriageAgent';
import * as geminiService from '../../services/geminiService';

vi.mock('../../services/geminiService', () => ({
  rankGDACSEvents: vi.fn(),
}));

describe('TriageAgent', () => {
  const mockContext = {
    agent: {
      sendMessage: vi.fn(),
      runTool: vi.fn().mockResolvedValue({ activeZoneIds: [] })
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should prioritize zones and emit event', async () => {
    const mockZones = [
      { name: 'Zone A', priority: 1, lat: 10, lng: 20, reason: 'High impact' }
    ];
    (geminiService.rankGDACSEvents as any).mockResolvedValue(mockZones);

    const mockAlerts = [{ 
      id: '1', 
      eventid: 1,
      episodeid: 1,
      type: 'Flood',
      name: 'Flood',
      country: 'Test',
      lat: 10, 
      lng: 20, 
      alertLevel: 'Green',
      severity: 'high' as any, 
      description: 'Flood',
      timestamp: new Date().toISOString()
    }];
    await TriageAgent.prioritize({ id: 'mission-1', data: { selectedZone: null, kitSpecialization: 'MEDICAL' } } as any, mockAlerts, mockContext);

    expect(geminiService.rankGDACSEvents).toHaveBeenCalled();
    expect(mockContext.agent.sendMessage).toHaveBeenCalledWith('COORDINATOR', expect.objectContaining({
      type: 'ZONE_PRIORITIZED'
    }));
  });

  it('should handle errors and emit MISSION_FAILED', async () => {
    (geminiService.rankGDACSEvents as any).mockRejectedValue(new Error('AI error'));

    await TriageAgent.prioritize({ id: 'mission-1', data: { selectedZone: null } } as any, [], mockContext);

    expect(mockContext.agent.sendMessage).toHaveBeenCalledWith('COORDINATOR', expect.objectContaining({
      type: 'MISSION_FAILED'
    }));
  });
});
