import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssemblyAgent } from '../agents/AssemblyAgent';
import { KitSpecialization } from '../types/mission';
import * as geminiService from '../../services/geminiService';

vi.mock('../../services/geminiService', () => ({
  getKitRecommendation: vi.fn(),
}));

describe('AssemblyAgent', () => {
  const mockContext = {
    agent: {
      sendMessage: vi.fn(),
      runTool: vi.fn()
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create kit plan and emit event', async () => {
    const mockKit = {
      kitType: 'Hydration Kit',
      items: ['water_purification_tablets', 'collapsible_water_container'],
      assemblyOrder: ['water_purification_tablets', 'collapsible_water_container'],
      missingItems: [],
      priority: 'high',
      reasoning: 'Needed for hydration',
      requiredResources: ['Standard Assembly Line']
    };
    (geminiService.getKitRecommendation as any).mockResolvedValue(mockKit);

    const mockZone = { name: 'Zone A', priority: 1, lat: 10, lng: 20, reason: 'High impact' };
    await AssemblyAgent.planKit('mission-1', mockZone, mockContext, KitSpecialization.MEDICAL);

    expect(geminiService.getKitRecommendation).toHaveBeenCalled();
    expect(mockContext.agent.sendMessage).toHaveBeenCalledWith('COORDINATOR', expect.objectContaining({
      type: 'KIT_PLAN_CREATED'
    }));
  });

  it('should handle errors and emit MISSION_FAILED', async () => {
    (geminiService.getKitRecommendation as any).mockRejectedValue(new Error('AI error'));

    await AssemblyAgent.planKit('mission-1', { name: 'Zone A', priority: 1, lat: 10, lng: 20, reason: 'High impact' }, mockContext, KitSpecialization.MEDICAL);

    expect(mockContext.agent.sendMessage).toHaveBeenCalledWith('COORDINATOR', expect.objectContaining({
      type: 'MISSION_FAILED'
    }));
  });
});
