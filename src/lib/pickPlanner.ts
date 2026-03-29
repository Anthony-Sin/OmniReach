
import { PickStep, KitPlanCreatedPayload } from '../types/mission';

import { allItems } from '../assets/items';
import { WORKSPACE_SHELF_SLOTS } from '../simulation/SpawnLayoutGenerator';

const WORKSPACE_SOURCE_SLOTS = WORKSPACE_SHELF_SLOTS.map(slot => [slot.x, slot.y, slot.z] as const);
const STAGING_SLOTS = [
  [0.02, 0.52, 0.35],
  [0.16, 0.52, 0.35],
  [0.02, 0.66, 0.35],
  [0.16, 0.66, 0.35]
] as const;
const HOME_POSITION = [0.3, 0.0, 0.4];
const HANDOFF_POSITION = [0.1, 0.58, 0.38];

// Mock workspace inventory laid out across a compact rack of reachable source slots.
export const MOCK_INVENTORY: Record<string, { 
  location: number[], 
  risk: 'LOW' | 'MEDIUM' | 'HIGH', 
  quantity: number,
  brand: string,
  category: string,
  imageSeed: string
}> = {};

export const AVAILABLE_WORKSPACE_ITEMS = allItems.map((item, index) => {
  const slot = WORKSPACE_SOURCE_SLOTS[index % WORKSPACE_SOURCE_SLOTS.length];
  return {
    name: item.name,
    category: item.category,
    quantity: 2,
    location: [...slot],
    imageSeed: item.name.split('_')[0]
  };
});

allItems.forEach((item, index) => {
  const slot = WORKSPACE_SOURCE_SLOTS[index % WORKSPACE_SOURCE_SLOTS.length];
  MOCK_INVENTORY[item.name] = {
    location: [...slot],
    risk: index % 2 === 0 ? 'LOW' : 'MEDIUM',
    quantity: 2,
    brand: 'AEGIS-CORP',
    category: item.category,
    imageSeed: item.name.split('_')[0]
  };
});

export class PickPlanner {
  static generateSequence(payload: KitPlanCreatedPayload): { steps: PickStep[], warnings: string[] } {
    const steps: PickStep[] = [];
    const warnings: string[] = [];
    
    const itemsToPick = (payload.items || []).slice(0, WORKSPACE_SOURCE_SLOTS.length);
    const missingItems = payload.missingItems || [];
    
    if (missingItems.length > 0) {
      warnings.push(`Missing items detected: ${missingItems.join(', ')}. Allocation reduced.`);
    }

    if ((payload.items || []).length > WORKSPACE_SOURCE_SLOTS.length) {
      warnings.push(`Workspace condensed to ${WORKSPACE_SOURCE_SLOTS.length} placed items so the arm scene stays clear and reachable.`);
    }

    itemsToPick.forEach((itemName, index) => {
      const itemData = MOCK_INVENTORY[itemName];
      const sourceSlot = WORKSPACE_SOURCE_SLOTS[index % WORKSPACE_SOURCE_SLOTS.length];
      const stageSlot = STAGING_SLOTS[index % STAGING_SLOTS.length];
      const hoverTarget = [sourceSlot[0], sourceSlot[1], sourceSlot[2] + 0.08];
      
      if (!itemData) {
        steps.push({
          id: `step-fallback-${index}`,
          action: 'FALLBACK',
          item: itemName,
          source: [0, 0, 0],
          target: [...stageSlot],
          riskLevel: 'HIGH',
          expectedDuration: 5,
          safetyChecks: ['Manual inspection required', 'Verify inventory records']
        });
        warnings.push(`Item ${itemName} is not mapped to the arm workspace. Added fallback step.`);
        return;
      }

      steps.push({
        id: `step-pick-${index}`,
        action: 'PICK',
        item: itemName,
        source: [...sourceSlot],
        target: hoverTarget,
        riskLevel: itemData.risk,
        expectedDuration: 8,
        safetyChecks: ['Check gripper pressure', 'Verify item weight', 'Confirm compact slot clearance']
      });

      steps.push({
        id: `step-stage-${index}`,
        action: 'STAGE',
        item: itemName,
        source: [...sourceSlot],
        target: [...stageSlot],
        riskLevel: itemData.risk,
        expectedDuration: 10,
        safetyChecks: ['Path clearance check', 'Tray slot availability']
      });
    });

    if (steps.length > 0) {
      steps.push({
        id: 'step-handoff-final',
        action: 'HANDOFF',
        item: 'COMPLETE_KIT',
        source: [...HANDOFF_POSITION],
        target: [0.24, 0.62, 0.38],
        riskLevel: 'MEDIUM',
        expectedDuration: 12,
        safetyChecks: ['Delivery tray lock verification', 'Weight balance check']
      });
    }

    steps.push({
      id: 'step-return-home',
      action: 'RETURN',
      item: 'ARM',
      source: steps.length > 0 ? [...HANDOFF_POSITION] : [...HOME_POSITION],
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
