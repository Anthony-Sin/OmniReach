
import { PickStep, KitPlanCreatedPayload } from '../types/mission';

import { allItems } from '../assets/items';

// Mock Inventory with coordinates [x, y, z] and quantities
// Workspace: X [0.3, 0.7], Y [-0.4, 0.4], Z [0.1, 0.6]
export const MOCK_INVENTORY: Record<string, { 
  location: number[], 
  risk: 'LOW' | 'MEDIUM' | 'HIGH', 
  quantity: number,
  brand: string,
  category: string,
  imageSeed: string
}> = {};

// Initialize MOCK_INVENTORY from allItems
allItems.forEach((item, index) => {
  const row = Math.floor(index / 4);
  const col = index % 4;
  MOCK_INVENTORY[item.name] = {
    location: [0.4 + (row * 0.1), -0.2 + (col * 0.1), 0.1],
    risk: index % 3 === 0 ? 'MEDIUM' : 'LOW',
    quantity: 3, // Default to high supply
    brand: 'AEGIS-CORP',
    category: item.category,
    imageSeed: item.name.split('_')[0]
  };
});

const STAGING_AREA = [0.5, 0.0, 0.5]; // Central staging point
const HOME_POSITION = [0.3, 0.0, 0.4];
const WAREHOUSE_B_LOCATION = [0.7, 0.3, 0.1]; // Alternative supply point

export class PickPlanner {
  static generateSequence(payload: KitPlanCreatedPayload): { steps: PickStep[], warnings: string[] } {
    const steps: PickStep[] = [];
    const warnings: string[] = [];
    
    const itemsToPick = payload.items || [];
    const missingItems = payload.missingItems || [];
    const reroutedItems = payload.reroutedItems || [];
    
    if (missingItems.length > 0) {
      warnings.push(`Missing items detected: ${missingItems.join(', ')}. Allocation reduced.`);
    }

    if (reroutedItems.length > 0) {
      warnings.push(`Rerouted items detected: ${reroutedItems.join(', ')}. Fetching from Warehouse_B.`);
    }

    // Combine items to pick and rerouted items for sequencing
    const allItems = [...itemsToPick, ...reroutedItems];

    // 1. Sort items by proximity to current position (starting at HOME)
    const sortedItems = allItems.sort((a, b) => {
      const locA = reroutedItems.includes(a) ? WAREHOUSE_B_LOCATION : (MOCK_INVENTORY[a]?.location || [0, 0, 0]);
      const locB = reroutedItems.includes(b) ? WAREHOUSE_B_LOCATION : (MOCK_INVENTORY[b]?.location || [0, 0, 0]);
      return locA[1] - locB[1];
    });

    let currentPos = HOME_POSITION;

    sortedItems.forEach((itemName, index) => {
      const isRerouted = reroutedItems.includes(itemName);
      const itemData = isRerouted 
        ? { location: WAREHOUSE_B_LOCATION, risk: 'HIGH' as const } 
        : MOCK_INVENTORY[itemName];
      
      if (!itemData) {
        // Fallback step for unknown items
        steps.push({
          id: `step-fallback-${index}`,
          action: 'FALLBACK',
          item: itemName,
          source: [0, 0, 0],
          target: STAGING_AREA,
          riskLevel: 'HIGH',
          expectedDuration: 5,
          safetyChecks: ['Manual inspection required', 'Verify inventory records']
        });
        warnings.push(`Item ${itemName} not found in primary inventory. Added fallback step.`);
        return;
      }

      // PICK phase
      steps.push({
        id: `step-pick-${index}`,
        action: 'PICK',
        item: itemName,
        source: itemData.location,
        target: itemData.location, // Hovering above source
        riskLevel: itemData.risk,
        expectedDuration: isRerouted ? 12 : 8,
        safetyChecks: ['Check gripper pressure', 'Verify item weight', isRerouted ? 'Warehouse_B clearance' : 'Standard clearance']
      });

      // STAGE phase
      steps.push({
        id: `step-stage-${index}`,
        action: 'STAGE',
        item: itemName,
        source: itemData.location,
        target: STAGING_AREA,
        riskLevel: itemData.risk,
        expectedDuration: 12,
        safetyChecks: ['Path clearance check', 'Staging area availability']
      });

      currentPos = STAGING_AREA;
    });

    // HANDOFF phase (Finalizing the kit)
    if (steps.length > 0) {
      steps.push({
        id: 'step-handoff-final',
        action: 'HANDOFF',
        item: 'COMPLETE_KIT',
        source: STAGING_AREA,
        target: [0.8, 0.0, 0.5], // Delivery drone handoff point
        riskLevel: 'MEDIUM',
        expectedDuration: 15,
        safetyChecks: ['Drone lock verification', 'Weight balance check']
      });
    }

    // RETURN phase
    steps.push({
      id: 'step-return-home',
      action: 'RETURN',
      item: 'ARM',
      source: currentPos,
      target: HOME_POSITION,
      riskLevel: 'LOW',
      expectedDuration: 5,
      safetyChecks: ['Workspace clear']
    });

    return { steps, warnings };
  }

  static calculateTotalDuration(steps: PickStep[]): number {
    return steps.reduce((total, step) => total + step.expectedDuration, 0);
  }
}
