import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogisticsAgent } from '../agents/LogisticsAgent';
import * as geminiService from '../../services/geminiService';

vi.mock('../../services/geminiService', () => ({
  explainLogisticsSequence: vi.fn(),
}));

describe('LogisticsAgent', () => {
  const mockContext = {
    agent: {
      sendMessage: vi.fn(),
      runTool: vi.fn().mockResolvedValue({ success: true })
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create pick sequence and emit event', async () => {
    (geminiService.explainLogisticsSequence as any).mockResolvedValue('Optimized sequence');

    const mockKit = {
      kitType: 'Hydration Kit',
      items: ['water_purification_tablets', 'collapsible_water_container'],
      assemblyOrder: ['water_purification_tablets', 'collapsible_water_container'],
      missingItems: [],
      priority: 'high' as any,
      reasoning: 'Needed for hydration',
      requiredResources: ['Standard Assembly Line']
    };
    await LogisticsAgent.createPickSequence('mission-1', mockKit, mockContext);

    expect(geminiService.explainLogisticsSequence).toHaveBeenCalled();
    expect(mockContext.agent.sendMessage).toHaveBeenCalledWith('COORDINATOR', expect.objectContaining({
      type: 'PICK_SEQUENCE_CREATED'
    }));
  });

  it('should handle errors and emit MISSION_FAILED', async () => {
    (geminiService.explainLogisticsSequence as any).mockRejectedValue(new Error('AI error'));

    await LogisticsAgent.createPickSequence('mission-1', { items: [], totalWeight: 0, priority: 'low', rationale: '' } as any, mockContext);

    expect(mockContext.agent.sendMessage).toHaveBeenCalledWith('COORDINATOR', expect.objectContaining({
      type: 'MISSION_FAILED'
    }));
  });
});
