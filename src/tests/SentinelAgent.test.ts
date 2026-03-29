import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SentinelAgent } from '../agents/SentinelAgent';
import * as geminiService from '../../services/geminiService';
import * as gdacsService from '../../services/gdacsService';

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

describe('SentinelAgent', () => {
  const mockContext = {
    agent: {
      sendMessage: vi.fn(),
      runTool: vi.fn()
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    SentinelAgent.reset();
  });

  it('should fetch and emit alerts', async () => {
    const mockEvents = [{ 
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
    }];
    (gdacsService.fetchGDACSEvents as any).mockResolvedValue(mockEvents);
    (geminiService.summarizeAlerts as any).mockResolvedValue('Summary');

    const promise = SentinelAgent.startMonitoring('mission-1', mockContext);
    vi.runAllTimers();
    await promise;

    expect(gdacsService.fetchGDACSEvents).toHaveBeenCalled();
    expect(mockContext.agent.sendMessage).toHaveBeenCalledWith('COORDINATOR', expect.objectContaining({
      type: 'ALERT_DETECTED'
    }));
  });

  it('should handle errors gracefully', async () => {
    (gdacsService.fetchGDACSEvents as any).mockRejectedValue(new Error('Network error'));

    const promise = SentinelAgent.startMonitoring('mission-1', mockContext);
    
    // withRetry(3 retries) means 4 attempts total.
    // We need to advance timers and wait for promises in a loop
    for (let i = 0; i < 4; i++) {
      await vi.runOnlyPendingTimersAsync();
    }
    
    await promise;

    expect(mockContext.agent.sendMessage).not.toHaveBeenCalledWith('COORDINATOR', expect.objectContaining({
      type: 'ALERT_DETECTED'
    }));
    expect(mockContext.agent.sendMessage).toHaveBeenCalledWith('COORDINATOR', expect.objectContaining({
      type: 'MISSION_FAILED'
    }));
  }, 10000);
});
