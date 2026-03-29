
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
  InventoryCheckStockOutputSchema
} from '../types/adk';

export class InventoryAgent {
  private static claimed: Map<string, string> = new Map(); // itemName -> missionId
  private static stock: Record<string, number> = { ...Object.fromEntries(Object.entries(MOCK_INVENTORY).map(([k, v]) => [k, v.quantity])) };
  private static _unsubscribe: (() => void) | null = null;

  static init() {
    this.setSupplyLevel('high');
  }

  static setSupplyLevel(level: 'low' | 'medium' | 'high') {
    console.log(`[Inventory] Setting supply levels to ${level}`);
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
    const claimedBy = this.claimed.get(item);
    return { 
      available: quantity > 0 && !claimedBy,
      claimedBy,
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
    const currentClaim = this.claimed.get(item);
    const quantity = this.stock[item] || 0;

    if (quantity > 0 && (!currentClaim || currentClaim === missionId)) {
      this.claimed.set(item, missionId);
      this.stock[item]--;
      return { success: true };
    } else {
      return { 
        success: false, 
        claimedBy: currentClaim || (quantity <= 0 ? 'OUT_OF_STOCK' : undefined)
      };
    }
  }

  static release(item: string, missionId: string) {
    if (this.claimed.get(item) === missionId) {
      this.claimed.delete(item);
      this.stock[item]++;
    }
    return { success: true };
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

export const inventoryAgent = new Agent({
  name: AgentType.INVENTORY,
  description: 'Manages rescue kit inventory and claims.',
  tools: [inventoryQueryTool, inventoryCheckStockTool, inventoryClaimTool, inventoryReleaseTool]
});
