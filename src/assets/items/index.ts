import { hydrationItems } from './hydration';
import { foodNutritionItems } from './nutrition';
import { medicalItems } from './medical';
import { ppeItems } from './ppe';
import { equipmentItems } from './equipment';
import { toolsItems } from './tools';
import { blanketItems } from './blankets';
import { hygieneItems } from './hygiene';

export const allItems = [
  ...hydrationItems,
  ...foodNutritionItems,
  ...medicalItems,
  ...ppeItems,
  ...equipmentItems,
  ...toolsItems,
  ...blanketItems,
  ...hygieneItems,
];

export const itemCatalog = allItems.map(item => ({
  name: item.name,
  category: item.category,
  triggerKeywords: (item as any).triggerKeywords,
}));
