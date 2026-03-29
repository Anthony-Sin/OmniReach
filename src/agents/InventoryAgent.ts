
import { Agent, Tool } from '../lib/adk';
import { AgentType } from '../types/mission';
import { MOCK_INVENTORY } from '../lib/pickPlanner';
import { 
  InventoryQueryInputSchema, 
  InventoryQueryOutputSchema, 
  InventoryClaimInputSchema, 
  InventoryClaimOutputSchema, 
  InventoryReleaseInputSchema, 
  InventoryReleaseOutputSchema,
  InventoryCheckStockInputSchema,
  InventoryCheckStockOutputSchema,
  InventoryConsumeMissionInputSchema,
  InventoryConsumeMissionOutputSchema
} from '../types/adk';

export class InventoryAgent {
  private static claimsByItem: Map<string, Map<string, number>> = new Map();
  private static claimsByMission: Map<string, Map<string, number>> = new Map();
  private static stock: Record<string, number> = { ...Object.fromEntries(Object.entries(MOCK_INVENTORY).map(([k, v]) => [k, v.quantity])) };
  private static _unsubscribe: (() => void) | null = null;

  static init() {
    this.setSupplyLevel('high');
  }

  static setSupplyLevel(level: 'low' | 'medium' | 'high') {
    console.log(`[Inventory] Setting supply levels to ${level}`);
    this.claimsByItem.clear();
    this.claimsByMission.clear();
    for (const item in MOCK_INVENTORY) {
      if (level === 'high') {
        this.stock[item] = 3;
      } else if (level === 'medium') {
        this.stock[item] = Math.random() > 0.5 ? 2 : 1;
      } else {
        // Low: some missing (20% chance), most have 1
        this.stock[item] = Math.random() > 0.2 ? 1 : 0;
      }
    }
  }

  // ADK Tool Methods
  static query(item: string) {
    const quantity = this.stock[item] || 0;
    const claims = this.claimsByItem.get(item);
    return { 
      available: quantity > 0,
      claimedBy: claims ? Array.from(claims.keys()) : undefined,
      quantity
    };
  }

  static checkStock(items: string[]) {
    const availableItems: string[] = [];
    const missingItems: string[] = [];
    const stockLevels: Record<string, number> = {};

    for (const item of items) {
      const quantity = this.stock[item] || 0;
      stockLevels[item] = quantity;
      if (quantity > 0) {
        availableItems.push(item);
      } else {
        missingItems.push(item);
      }
    }

    return { availableItems, missingItems, stockLevels };
  }

  static claim(item: string, missionId: string) {
    const quantity = this.stock[item] || 0;

    if (quantity > 0) {
      this.stock[item]--;

      const itemClaims = this.claimsByItem.get(item) ?? new Map<string, number>();
      itemClaims.set(missionId, (itemClaims.get(missionId) ?? 0) + 1);
      this.claimsByItem.set(item, itemClaims);

      const missionClaims = this.claimsByMission.get(missionId) ?? new Map<string, number>();
      missionClaims.set(item, (missionClaims.get(item) ?? 0) + 1);
      this.claimsByMission.set(missionId, missionClaims);

      return { success: true };
    } else {
      const currentClaimers = this.claimsByItem.get(item);
      return { 
        success: false, 
        claimedBy: currentClaimers ? Array.from(currentClaimers.keys()).join(',') : 'OUT_OF_STOCK'
      };
    }
  }

  static release(item: string, missionId: string) {
    const itemClaims = this.claimsByItem.get(item);
    const missionClaims = this.claimsByMission.get(missionId);
    const itemClaimCount = itemClaims?.get(missionId) ?? 0;
    const missionClaimCount = missionClaims?.get(item) ?? 0;

    if (itemClaimCount > 0 && missionClaimCount > 0) {
      this.stock[item] = (this.stock[item] || 0) + 1;

      if (itemClaimCount === 1) itemClaims!.delete(missionId);
      else itemClaims!.set(missionId, itemClaimCount - 1);
      if (itemClaims && itemClaims.size === 0) this.claimsByItem.delete(item);

      if (missionClaimCount === 1) missionClaims!.delete(item);
      else missionClaims!.set(item, missionClaimCount - 1);
      if (missionClaims && missionClaims.size === 0) this.claimsByMission.delete(missionId);
    }
    return { success: true };
  }

  static consumeMission(missionId: string) {
    const missionClaims = this.claimsByMission.get(missionId);
    if (!missionClaims) {
      return { success: true, consumedItems: [] };
    }

    const consumedItems = Array.from(missionClaims.entries()).flatMap(([item, count]) =>
      Array.from({ length: count }, () => item)
    );

    for (const [item, count] of missionClaims.entries()) {
      const itemClaims = this.claimsByItem.get(item);
      if (!itemClaims) continue;

      const itemClaimCount = itemClaims.get(missionId) ?? 0;
      if (itemClaimCount <= count) itemClaims.delete(missionId);
      else itemClaims.set(missionId, itemClaimCount - count);

      if (itemClaims.size === 0) {
        this.claimsByItem.delete(item);
      }
    }

    this.claimsByMission.delete(missionId);
    return { success: true, consumedItems };
  }
}

export const inventoryQueryTool = new Tool({
  name: 'query',
  description: 'Queries the inventory for item availability.',
  inputSchema: InventoryQueryInputSchema,
  outputSchema: InventoryQueryOutputSchema,
  run: async ({ item }) => InventoryAgent.query(item)
});

export const inventoryCheckStockTool = new Tool({
  name: 'checkStock',
  description: 'Checks stock levels for multiple items.',
  inputSchema: InventoryCheckStockInputSchema,
  outputSchema: InventoryCheckStockOutputSchema,
  run: async ({ items }) => InventoryAgent.checkStock(items)
});

export const inventoryClaimTool = new Tool({
  name: 'claim',
  description: 'Claims an item from inventory for a mission.',
  inputSchema: InventoryClaimInputSchema,
  outputSchema: InventoryClaimOutputSchema,
  run: async ({ item, missionId }) => InventoryAgent.claim(item, missionId)
});

export const inventoryReleaseTool = new Tool({
  name: 'release',
  description: 'Releases a claimed item back to inventory.',
  inputSchema: InventoryReleaseInputSchema,
  outputSchema: InventoryReleaseOutputSchema,
  run: async ({ item, missionId }) => InventoryAgent.release(item, missionId)
});

export const inventoryConsumeMissionTool = new Tool({
  name: 'consumeMission',
  description: 'Marks all inventory reserved by a mission as consumed.',
  inputSchema: InventoryConsumeMissionInputSchema,
  outputSchema: InventoryConsumeMissionOutputSchema,
  run: async ({ missionId }) => InventoryAgent.consumeMission(missionId)
});

export const inventoryAgent = new Agent({
  name: AgentType.INVENTORY,
  description: 'Manages rescue kit inventory and claims.',
  tools: [inventoryQueryTool, inventoryCheckStockTool, inventoryClaimTool, inventoryReleaseTool, inventoryConsumeMissionTool]
});
