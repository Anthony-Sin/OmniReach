import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeliveryAgent } from '../agents/DeliveryAgent';
import * as geminiService from '../../services/geminiService';
import { RoutePlanner } from '../lib/routePlanner';

vi.mock('../../services/geminiService', () => ({
  generateRouteNarrative: vi.fn(),
}));

vi.mock('../lib/routePlanner', () => ({
  RoutePlanner: {
    generateRoute: vi.fn(),
  },
}));

describe('DeliveryAgent', () => {
  const mockContext = {
    agent: {
      sendMessage: vi.fn(),
      runTool: vi.fn()
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should plan route and emit events', async () => {
    (geminiService.generateRouteNarrative as any).mockResolvedValue('Route narrative');
    (RoutePlanner.generateRoute as any).mockReturnValue({
      waypoints: [[10, 20]],
      transportMode: 'DRONE',
      eta: 300,
      riskFlags: [],
      constraints: []
    });

    const mockSource = { lat: 0, lng: 0, name: 'Source' };
    const mockTarget = { lat: 10, lng: 20, name: 'Target' };
    await DeliveryAgent.planRoute('mission-1', mockSource, mockTarget, mockContext);

    expect(RoutePlanner.generateRoute).toHaveBeenCalled();
    expect(geminiService.generateRouteNarrative).toHaveBeenCalled();
    expect(mockContext.agent.sendMessage).toHaveBeenCalledWith('COORDINATOR', expect.objectContaining({
      type: 'DELIVERY_ROUTE_CREATED'
    }));
    expect(mockContext.agent.sendMessage).toHaveBeenCalledWith('COORDINATOR', expect.objectContaining({
      type: 'MISSION_COMPLETE'
    }));
  });

  it('should handle errors and emit MISSION_FAILED', async () => {
    (RoutePlanner.generateRoute as any).mockImplementation(() => { throw new Error('Planner error'); });

    await DeliveryAgent.planRoute('mission-1', {} as any, {} as any, mockContext);

    expect(mockContext.agent.sendMessage).toHaveBeenCalledWith('COORDINATOR', expect.objectContaining({
      type: 'MISSION_FAILED'
    }));
  });
});
