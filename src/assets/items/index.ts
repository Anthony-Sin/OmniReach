/**
 * @license SPDX-License-Identifier: Apache-2.0
 * * index.ts — Consolidated Item Catalog
 * * Removed large items: down_jacket, solar_lantern, rope_coil, safety_vest, 
 * hard_hat, defibrillator, stretcher, large_water_jug, thermos, tarp, 
 * hand_warmers, toilet_paper_roll, and wet_wipes.
 */

export interface ItemDefinition {
  name: string;
  category: string;
  triggerKeywords?: string[];
  rgba?: string;
  xml: (i: number, x: number, y: number) => string;
}

export interface CatalogEntry {
  name: string;
  category: string;
  triggerKeywords?: string[];
}

// ─── HYDRATION ITEMS ─────────────────────────────────────────────────────────
const hydrationItems: ItemDefinition[] = [
  {
    name: 'water_bottle',
    category: 'hydration',
    triggerKeywords: ['flood', 'heat', 'drought', 'wildfire', 'earthquake'],
    rgba: '0.2 0.6 1 0.5',
    xml: (i: number, x: number, y: number) => `
      <body name="water_bottle${i}" pos="${x} ${y} 0.06">
        <freejoint/>
        <geom name="wb_body${i}" type="cylinder" size="0.028 0.06"
              rgba="0.2 0.6 1 0.45" mass="0.3" friction="1.5 0.3 0.1"
              solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
        <geom type="cylinder" size="0.0285 0.018" pos="0 0 0" rgba="1 1 1 0.9"/>
        <geom type="cylinder" size="0.026 0.008" pos="0 0 0.068" rgba="0.2 0.6 1 0.5"/>
        <geom type="cylinder" size="0.012 0.012" pos="0 0 0.075" rgba="1 1 1 1"/>
      </body>`
  }
];

// ─── MEDICAL ITEMS ───────────────────────────────────────────────────────────
const medicalItems: ItemDefinition[] = [
  {
    name: 'first_aid_kit',
    category: 'medical',
    triggerKeywords: ['earthquake', 'hurricane', 'tornado', 'wildfire', 'flood'],
    rgba: '0.9 0.1 0.1 1',
    xml: (i: number, x: number, y: number) => `
      <body name="first_aid_kit${i}" pos="${x} ${y} 0.025">
        <freejoint/>
        <geom name="fak_body${i}" type="box" size="0.065 0.05 0.025"
              rgba="0.88 0.08 0.08 1" mass="0.5" friction="1.2 0.3 0.1"
              solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
        <geom type="box" size="0.028 0.008 0.001" pos="0 0 0.026" rgba="1 1 1 1"/>
        <geom type="box" size="0.008 0.028 0.001" pos="0 0 0.026" rgba="1 1 1 1"/>
      </body>`
  },
  {
    name: 'medicine_bottle',
    category: 'medical',
    triggerKeywords: ['pandemic', 'earthquake', 'flood'],
    rgba: '0.8 0.4 0.1 1',
    xml: (i: number, x: number, y: number) => `
      <body name="medicine_bottle${i}" pos="${x} ${y} 0.035">
        <freejoint/>
        <geom name="mb_body${i}" type="cylinder" size="0.018 0.035"
              rgba="0.7 0.35 0.1 0.9" mass="0.05" friction="1.0 0.3 0.1"
              solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
        <geom type="cylinder" size="0.0185 0.02" pos="0 0 0" rgba="1 1 1 1"/>
        <geom type="cylinder" size="0.019 0.008" pos="0 0 0.035" rgba="0.95 0.95 0.95 1"/>
      </body>`
  }
];

// ─── NUTRITION ITEMS ─────────────────────────────────────────────────────────
const foodNutritionItems: ItemDefinition[] = [
  {
    name: 'food_can',
    category: 'nutrition',
    triggerKeywords: ['earthquake', 'hurricane', 'tornado', 'flood', 'blizzard'],
    rgba: '0.8 0.8 0.8 1',
    xml: (i: number, x: number, y: number) => `
      <body name="food_can${i}" pos="${x} ${y} 0.05">
        <freejoint/>
        <geom name="fc_body${i}" type="cylinder" size="0.030 0.048"
              rgba="0.8 0.8 0.82 1" mass="0.2" friction="1.5 0.3 0.1"
              solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
        <geom type="cylinder" size="0.031 0.002" pos="0 0 0.05" rgba="0.65 0.65 0.67 1"/>
        <geom type="cylinder" size="0.031 0.002" pos="0 0 -0.05" rgba="0.65 0.65 0.67 1"/>
        <geom type="cylinder" size="0.0305 0.035" pos="0 0 0" rgba="1 1 1 1"/>
      </body>`
  },
  {
    name: 'trail_mix_bag',
    category: 'nutrition',
    triggerKeywords: ['wildfire', 'earthquake', 'blizzard', 'hurricane'],
    rgba: '0.7 0.5 0.3 1',
    xml: (i: number, x: number, y: number) => `
      <body name="trail_mix_bag${i}" pos="${x} ${y} 0.012">
        <freejoint/>
        <geom name="tmb_body${i}" type="box" size="0.055 0.08 0.012"
              rgba="0.82 0.72 0.52 0.85" mass="0.12" friction="0.9 0.2 0.1"
              solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
        <geom type="box" size="0.045 0.06 0.001" pos="0 0 0.013" rgba="1 1 1 0.9"/>
      </body>`
  }
];

// ─── PPE ITEMS ───────────────────────────────────────────────────────────────
const ppeItems: ItemDefinition[] = [
  {
    name: 'n95_mask',
    category: 'ppe',
    triggerKeywords: ['pandemic', 'wildfire', 'volcano', 'earthquake'],
    rgba: '0.95 0.95 0.95 1',
    xml: (i: number, x: number, y: number) => `
      <body name="n95_mask${i}" pos="${x} ${y} 0.015">
        <freejoint/>
        <geom name="mask_cup${i}" type="sphere" size="0.045"
              rgba="0.98 0.98 0.98 1" mass="0.01" friction="0.5 0.1 0.1"/>
        <geom type="box" size="0.015 0.002 0.005" pos="0 0.04 0.01" rgba="0.8 0.8 0.8 1"/>
      </body>`
  },
  {
    name: 'work_gloves',
    category: 'ppe',
    triggerKeywords: ['earthquake', 'flood', 'hurricane', 'tornado', 'blizzard'],
    rgba: '0.6 0.5 0.3 1',
    xml: (i: number, x: number, y: number) => `
      <body name="work_gloves${i}" pos="${x} ${y} 0.01">
        <freejoint/>
        <geom name="glove_left${i}" type="box" size="0.045 0.065 0.01"
              rgba="0.75 0.65 0.45 1" mass="0.1" friction="1.2 0.4 0.1"/>
        <geom name="glove_right${i}" type="box" size="0.045 0.065 0.01"
              pos="0.1 0 0" rgba="0.75 0.65 0.45 1"/>
      </body>`
  },
  {
    name: 'safety_boots',
    category: 'ppe',
    triggerKeywords: ['earthquake', 'flood', 'wildfire', 'hurricane'],
    rgba: '0.25 0.18 0.12 1',
    xml: (i: number, x: number, y: number) => `
      <body name="safety_boots${i}" pos="${x} ${y} 0.04">
        <freejoint/>
        <geom name="sb_left_sole${i}" type="box" size="0.038 0.085 0.01"
              rgba="0.18 0.12 0.08 1" mass="0.6" friction="2.0 0.5 0.1"
              solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
        <geom type="box" size="0.034 0.075 0.04" pos="-0.002 0.005 0.03" rgba="0.22 0.15 0.1 1"/>
      </body>`
  }
];

// ─── EQUIPMENT ITEMS ─────────────────────────────────────────────────────────
const equipmentItems: ItemDefinition[] = [
  {
    name: 'flashlight',
    category: 'equipment',
    triggerKeywords: ['earthquake', 'hurricane', 'tornado', 'flood', 'blizzard'],
    rgba: '0.12 0.12 0.12 1',
    xml: (i: number, x: number, y: number) => `
      <body name="flashlight${i}" pos="${x} ${y} 0.015">
        <freejoint/>
        <geom name="fl_handle${i}" type="cylinder" size="0.012 0.065"
              rgba="0.1 0.1 0.1 1" mass="0.18" friction="1.5 0.3 0.1"
              solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
        <geom type="cylinder" size="0.022 0.025" pos="0 0 0.075" rgba="0.15 0.15 0.15 1"/>
        <geom type="cylinder" size="0.019 0.001" pos="0 0 0.101" rgba="0.9 0.9 1 0.8"/>
      </body>`
  },
  {
    name: 'emergency_radio',
    category: 'equipment',
    triggerKeywords: ['earthquake', 'hurricane', 'tornado', 'flood', 'blizzard'],
    rgba: '0.85 0.3 0.1 1',
    xml: (i: number, x: number, y: number) => `
      <body name="emergency_radio${i}" pos="${x} ${y} 0.035">
        <freejoint/>
        <geom name="er_body${i}" type="box" size="0.08 0.045 0.035"
              rgba="0.8 0.25 0.1 1" mass="0.4" friction="1.1 0.3 0.1"
              solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
        <geom type="cylinder" size="0.025 0.005" pos="0.045 0.01 0.036" rgba="0.2 0.2 0.2 1"/>
      </body>`
  },
  {
    name: 'emergency_whistle',
    category: 'equipment',
    triggerKeywords: ['earthquake', 'flood', 'hurricane', 'tornado'],
    rgba: '1 0.7 0 1',
    xml: (i: number, x: number, y: number) => `
      <body name="emergency_whistle${i}" pos="${x} ${y} 0.008">
        <freejoint/>
        <geom name="ew_body${i}" type="box" size="0.018 0.038 0.008"
              rgba="1 0.65 0 1" mass="0.012" friction="0.9 0.2 0.1"
              solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
      </body>`
  }
];

// ─── TOOLS ITEMS ─────────────────────────────────────────────────────────────
const toolsItems: ItemDefinition[] = [
  {
    name: 'shovel',
    category: 'tools',
    triggerKeywords: ['earthquake', 'flood', 'hurricane', 'blizzard'],
    rgba: '0.6 0.38 0.15 1',
    xml: (i: number, x: number, y: number) => `
      <body name="shovel${i}" pos="${x} ${y} 0.012">
        <freejoint/>
        <geom name="sh_handle${i}" type="cylinder" size="0.012 0.22"
              rgba="0.58 0.35 0.12 1" mass="0.5" friction="1.0 0.3 0.1"
              solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"
              quat="0.707 0 0.707 0"/>
        <geom type="box" size="0.08 0.1 0.005" pos="0 0.28 0" rgba="0.45 0.45 0.48 1"/>
      </body>`
  },
  {
    name: 'multi_tool',
    category: 'tools',
    triggerKeywords: ['earthquake', 'hurricane', 'tornado', 'flood', 'blizzard'],
    rgba: '0.5 0.5 0.5 1',
    xml: (i: number, x: number, y: number) => `
      <body name="multi_tool${i}" pos="${x} ${y} 0.01">
        <freejoint/>
        <geom name="mt_body${i}" type="box" size="0.015 0.05 0.01"
              rgba="0.45 0.45 0.48 1" mass="0.15" friction="1.2 0.3 0.1"
              solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
      </body>`
  },
  {
    name: 'duct_tape_roll',
    category: 'tools',
    triggerKeywords: ['hurricane', 'earthquake', 'tornado', 'flood'],
    rgba: '0.45 0.45 0.48 1',
    xml: (i: number, x: number, y: number) => `
      <body name="duct_tape_roll${i}" pos="${x} ${y} 0.025">
        <freejoint/>
        <geom name="dt_outer${i}" type="cylinder" size="0.048 0.022"
              rgba="0.42 0.42 0.45 1" mass="0.25" friction="1.5 0.5 0.1"
              solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
        <geom type="cylinder" size="0.032 0.023" rgba="0.85 0.8 0.7 1"/>
      </body>`
  }
];

// ─── BLANKETS ITEMS ──────────────────────────────────────────────────────────
const blanketItems: ItemDefinition[] = [
  {
    name: 'emergency_blanket',
    category: 'blankets',
    triggerKeywords: ['blizzard', 'earthquake', 'hurricane', 'flood'],
    rgba: '0.85 0.85 0.9 0.8',
    xml: (i: number, x: number, y: number) => `
      <body name="emergency_blanket${i}" pos="${x} ${y} 0.004">
        <joint type="free"/>
        <geom name="eb_sheet${i}" type="box" size="0.055 0.075 0.004"
              rgba="0.88 0.82 0.62 0.85" mass="0.05" friction="0.5 0.1 0.05"
              solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
      </body>`
  }
];

// ─── HYGIENE ITEMS ───────────────────────────────────────────────────────────
const hygieneItems: ItemDefinition[] = [
  {
    name: 'hand_sanitizer',
    category: 'hygiene',
    triggerKeywords: ['pandemic', 'flood', 'earthquake', 'hurricane'],
    rgba: '0.7 0.95 0.7 0.8',
    xml: (i: number, x: number, y: number) => `
      <body name="hand_sanitizer${i}" pos="${x} ${y} 0.055">
        <joint type="free"/>
        <geom name="hs_body${i}" type="cylinder" size="0.022 0.052"
              rgba="0.65 0.92 0.65 0.78" mass="0.08" friction="1.1 0.3 0.1"
              solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
        <geom type="cylinder" size="0.0225 0.028" pos="0 0 -0.01" rgba="1 1 1 1"/>
      </body>`
  },
  {
    name: 'soap_bar',
    category: 'hygiene',
    triggerKeywords: ['flood', 'earthquake', 'hurricane', 'pandemic'],
    rgba: '0.9 0.9 1 1',
    xml: (i: number, x: number, y: number) => `
      <body name="soap_bar${i}" pos="${x} ${y} 0.012">
        <joint type="free"/>
        <geom name="soap_geom${i}" type="box" size="0.04 0.025 0.012"
              rgba="0.92 0.92 0.98 1" mass="0.1" friction="0.4 0.1 0.1"
              solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
      </body>`
  },
  {
    name: 'toothbrush_toothpaste',
    category: 'hygiene',
    triggerKeywords: ['flood', 'earthquake', 'hurricane'],
    rgba: '0.4 0.7 1 1',
    xml: (i: number, x: number, y: number) => `
      <body name="toothbrush_set${i}" pos="${x} ${y} 0.005">
        <joint type="free"/>
        <geom name="tb_handle${i}" type="box" size="0.08 0.006 0.005"
              rgba="0.2 0.6 0.9 1" mass="0.02" friction="0.8 0.2 0.1"/>
        <geom name="tp_tube${i}" type="box" size="0.06 0.018 0.01"
              pos="0 0.03 0.005" rgba="0.95 0.95 0.95 1" mass="0.05"/>
      </body>`
  },
  {
    name: 'sunscreen_tube',
    category: 'hygiene',
    triggerKeywords: ['wildfire', 'heat', 'earthquake', 'flood'],
    rgba: '1 0.88 0.2 1',
    xml: (i: number, x: number, y: number) => `
      <body name="sunscreen_tube${i}" pos="${x} ${y} 0.012">
        <joint type="free"/>
        <geom name="sc_tube${i}" type="box" size="0.018 0.065 0.012"
              rgba="0.98 0.85 0.18 1" mass="0.06" friction="0.9 0.2 0.1"
              solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
      </body>`
  }
];

// ─── AGGREGATED EXPORTS ──────────────────────────────────────────────────────

/**
 * allItems — flat array of every item object.
 */
export const allItems: ItemDefinition[] = [
  ...hydrationItems,
  ...medicalItems,
  ...foodNutritionItems,
  ...ppeItems,
  ...equipmentItems,
  ...toolsItems,
  ...blanketItems,
  ...hygieneItems,
];

/**
 * itemCatalog — lightweight list for filtering/searching.
 */
export const itemCatalog: CatalogEntry[] = allItems.map(
  ({ name, category, triggerKeywords }) => ({ name, category, triggerKeywords })
);

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function getItemsByCategory(category: string): ItemDefinition[] {
  return allItems.filter(item => item.category === category);
}

export function getItemsByKeyword(keyword: string): ItemDefinition[] {
  const kw = keyword.toLowerCase();
  return allItems.filter(item =>
    item.triggerKeywords?.some(k => k.toLowerCase() === kw)
  );
}

export function getItemByName(name: string): ItemDefinition | undefined {
  return allItems.find(item => item.name === name);
}

export const categories: string[] = [...new Set(allItems.map(i => i.category))];

export const totalItems: number = allItems.length;