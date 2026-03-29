/**
 * @license SPDX-License-Identifier: Apache-2.0
 * index.ts — Consolidated Item Catalog
 *
 * All items redesigned for top-down recognisability:
 *  - Distinctive cap / face markings (symbols, crosses, lens circles, etc.)
 *  - Contrasting label bands on cylindrical / tall items
 *  - Text-strip simulations using thin box geoms (stripes that read as labels)
 *  - Icon geometry on the top surface (cross, wave, sun, bolt, grille, etc.)
 *  - Rich colour layering so each item has a unique silhouette & palette
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

// ─── HYDRATION ───────────────────────────────────────────────────────────────

const hydrationItems: ItemDefinition[] = [
  {
    name: 'water_bottle',
    category: 'hydration',
    triggerKeywords: ['flood', 'heat', 'drought', 'wildfire', 'earthquake'],
    rgba: '0.2 0.6 1 0.8',
    xml: (i, x, y) => `
      <body name="water_bottle${i}" pos="${x} ${y} 0.06">
        <freejoint/>
        <!-- main translucent body -->
        <geom name="wb_body${i}"      type="cylinder" size="0.028 0.060"
              rgba="0.15 0.55 0.95 0.55" mass="0.3"
              friction="1.5 0.3 0.1" solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
        <!-- white label band (wider than body so visible from top) -->
        <geom name="wb_label${i}"     type="cylinder" size="0.030 0.018" pos="0 0 0"
              rgba="1 1 1 0.92"/>
        <!-- blue label text-stripe 1 -->
        <geom name="wb_stripe1${i}"   type="box" size="0.029 0.004 0.018" pos="0 0 0"
              rgba="0.1 0.45 0.85 1"/>
        <!-- blue label text-stripe 2 (perpendicular) -->
        <geom name="wb_stripe2${i}"   type="box" size="0.004 0.029 0.018" pos="0 0 0"
              rgba="0.1 0.45 0.85 0.6"/>
        <!-- shoulder ring -->
        <geom name="wb_shoulder${i}"  type="cylinder" size="0.026 0.005" pos="0 0 0.064"
              rgba="0.18 0.5 0.9 1"/>
        <!-- white cap -->
        <geom name="wb_cap${i}"       type="cylinder" size="0.014 0.010" pos="0 0 0.074"
              rgba="1 1 1 1"/>
        <!-- cap centre dot (water-drop blue) -->
        <geom name="wb_dot${i}"       type="sphere"   size="0.006"        pos="0 0 0.086"
              rgba="0.1 0.45 0.85 1"/>
      </body>`
  }
];

// ─── MEDICAL ─────────────────────────────────────────────────────────────────

const medicalItems: ItemDefinition[] = [
  {
    name: 'first_aid_kit',
    category: 'medical',
    triggerKeywords: ['earthquake', 'hurricane', 'tornado', 'wildfire', 'flood'],
    rgba: '0.9 0.1 0.1 1',
    xml: (i, x, y) => `
      <body name="first_aid_kit${i}" pos="${x} ${y} 0.025">
        <freejoint/>
        <!-- main box -->
        <geom name="fak_body${i}"    type="box" size="0.065 0.050 0.025"
              rgba="0.86 0.07 0.07 1" mass="0.5"
              friction="1.2 0.3 0.1" solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
        <!-- white border inset -->
        <geom name="fak_border${i}"  type="box" size="0.062 0.047 0.001" pos="0 0 0.026"
              rgba="1 1 1 0.9"/>
        <!-- red fill inside border -->
        <geom name="fak_fill${i}"    type="box" size="0.058 0.043 0.001" pos="0 0 0.027"
              rgba="0.86 0.07 0.07 1"/>
        <!-- cross — horizontal bar -->
        <geom name="fak_crossH${i}"  type="box" size="0.030 0.009 0.002" pos="0 0 0.028"
              rgba="1 1 1 1"/>
        <!-- cross — vertical bar -->
        <geom name="fak_crossV${i}"  type="box" size="0.009 0.030 0.002" pos="0 0 0.028"
              rgba="1 1 1 1"/>
        <!-- small latch nub at front -->
        <geom name="fak_latch${i}"   type="box" size="0.010 0.004 0.005" pos="0 -0.052 0.010"
              rgba="0.7 0.7 0.75 1"/>
      </body>`
  },
  {
    name: 'medicine_bottle',
    category: 'medical',
    triggerKeywords: ['pandemic', 'earthquake', 'flood'],
    rgba: '0.8 0.4 0.1 1',
    xml: (i, x, y) => `
      <body name="medicine_bottle${i}" pos="${x} ${y} 0.040">
        <freejoint/>
        <!-- amber body -->
        <geom name="mb_body${i}"     type="cylinder" size="0.018 0.038"
              rgba="0.75 0.38 0.08 0.88" mass="0.08"
              friction="1.0 0.3 0.1" solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
        <!-- white label band (slightly larger radius) -->
        <geom name="mb_label${i}"    type="cylinder" size="0.0195 0.020" pos="0 0 -0.008"
              rgba="1 1 1 0.95"/>
        <!-- Rx symbol — vertical bar -->
        <geom name="mb_rxV${i}"      type="box" size="0.003 0.012 0.001" pos="-0.004 0 0.013"
              rgba="0.1 0.1 0.5 1"/>
        <!-- Rx symbol — R curve-top -->
        <geom name="mb_rxC${i}"      type="box" size="0.008 0.003 0.001" pos="0 0.006 0.013"
              rgba="0.1 0.1 0.5 1"/>
        <!-- Rx symbol — diagonal leg -->
        <geom name="mb_rxD${i}"      type="box" size="0.010 0.003 0.001" pos="0.003 -0.005 0.013"
              quat="0.966 0 0 0.259" rgba="0.1 0.1 0.5 1"/>
        <!-- child-proof white cap -->
        <geom name="mb_cap${i}"      type="cylinder" size="0.0195 0.009" pos="0 0 0.046"
              rgba="0.97 0.97 0.97 1"/>
        <!-- cap grip ridges -->
        <geom name="mb_ridge1${i}"   type="box" size="0.0195 0.002 0.009" pos="0 0 0.046"
              rgba="0.85 0.85 0.85 1"/>
        <geom name="mb_ridge2${i}"   type="box" size="0.002 0.0195 0.009" pos="0 0 0.046"
              rgba="0.85 0.85 0.85 1"/>
      </body>`
  }
];

// ─── NUTRITION ────────────────────────────────────────────────────────────────

const foodNutritionItems: ItemDefinition[] = [
  {
    name: 'food_can',
    category: 'nutrition',
    triggerKeywords: ['earthquake', 'hurricane', 'tornado', 'flood', 'blizzard'],
    rgba: '0.8 0.8 0.8 1',
    xml: (i, x, y) => `
      <body name="food_can${i}" pos="${x} ${y} 0.050">
        <freejoint/>
        <!-- steel body -->
        <geom name="fc_body${i}"     type="cylinder" size="0.032 0.048"
              rgba="0.82 0.82 0.84 1" mass="0.22"
              friction="1.5 0.3 0.1" solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
        <!-- coloured label (tomato red for canned goods) -->
        <geom name="fc_label${i}"    type="cylinder" size="0.033 0.030" pos="0 0 0.004"
              rgba="0.85 0.18 0.12 1"/>
        <!-- label text lines — 3 thin white stripes -->
        <geom name="fc_txt1${i}"     type="box" size="0.033 0.028 0.002" pos="0 0 0.012"
              rgba="1 1 1 0.35"/>
        <geom name="fc_txt2${i}"     type="box" size="0.033 0.028 0.002" pos="0 0 0.004"
              rgba="1 1 1 0.18"/>
        <geom name="fc_txt3${i}"     type="box" size="0.033 0.028 0.002" pos="0 0 -0.004"
              rgba="1 1 1 0.18"/>
        <!-- top rim -->
        <geom name="fc_topRim${i}"   type="cylinder" size="0.033 0.002" pos="0 0 0.050"
              rgba="0.65 0.65 0.68 1"/>
        <!-- top lid inner circle -->
        <geom name="fc_lid${i}"      type="cylinder" size="0.026 0.001" pos="0 0 0.053"
              rgba="0.75 0.75 0.78 1"/>
        <!-- pull-tab ring -->
        <geom name="fc_ring${i}"     type="box" size="0.014 0.005 0.002" pos="0.014 0 0.056"
              rgba="0.55 0.55 0.58 1"/>
        <!-- bottom rim -->
        <geom name="fc_botRim${i}"   type="cylinder" size="0.033 0.002" pos="0 0 -0.050"
              rgba="0.65 0.65 0.68 1"/>
      </body>`
  },
  {
    name: 'trail_mix_bag',
    category: 'nutrition',
    triggerKeywords: ['wildfire', 'earthquake', 'blizzard', 'hurricane'],
    rgba: '0.7 0.5 0.3 1',
    xml: (i, x, y) => `
      <body name="trail_mix_bag${i}" pos="${x} ${y} 0.013">
        <freejoint/>
        <!-- bag body -->
        <geom name="tmb_body${i}"    type="box" size="0.055 0.080 0.013"
              rgba="0.80 0.68 0.48 0.92" mass="0.13"
              friction="0.9 0.2 0.1" solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
        <!-- white front panel -->
        <geom name="tmb_panel${i}"   type="box" size="0.048 0.068 0.001" pos="0 0 0.014"
              rgba="1 1 1 0.92"/>
        <!-- brand colour bar (green) -->
        <geom name="tmb_bar${i}"     type="box" size="0.048 0.014 0.001" pos="0 0.024 0.015"
              rgba="0.15 0.62 0.25 1"/>
        <!-- text line 1 (dark, simulates bold name) -->
        <geom name="tmb_tl1${i}"     type="box" size="0.036 0.005 0.001" pos="0 0.004 0.015"
              rgba="0.25 0.18 0.08 1"/>
        <!-- text line 2 (smaller) -->
        <geom name="tmb_tl2${i}"     type="box" size="0.028 0.004 0.001" pos="0 -0.005 0.015"
              rgba="0.45 0.35 0.15 1"/>
        <!-- text line 3 -->
        <geom name="tmb_tl3${i}"     type="box" size="0.022 0.003 0.001" pos="0 -0.013 0.015"
              rgba="0.45 0.35 0.15 0.7"/>
        <!-- nut / berry dots scattered on panel -->
        <geom name="tmb_nut1${i}"    type="sphere" size="0.005" pos="-0.02 -0.026 0.016"
              rgba="0.55 0.28 0.08 1"/>
        <geom name="tmb_nut2${i}"    type="sphere" size="0.004" pos="0.018 -0.030 0.016"
              rgba="0.72 0.12 0.12 1"/>
        <geom name="tmb_nut3${i}"    type="sphere" size="0.004" pos="-0.005 -0.032 0.016"
              rgba="0.88 0.68 0.18 1"/>
        <!-- seal stripe at top -->
        <geom name="tmb_seal${i}"    type="box" size="0.055 0.006 0.008" pos="0 0.074 0.006"
              rgba="0.60 0.48 0.32 1"/>
      </body>`
  }
];

// ─── PPE ─────────────────────────────────────────────────────────────────────

const ppeItems: ItemDefinition[] = [
  {
    name: 'n95_mask',
    category: 'ppe',
    triggerKeywords: ['pandemic', 'wildfire', 'volcano', 'earthquake'],
    rgba: '0.95 0.95 0.95 1',
    xml: (i, x, y) => `
      <body name="n95_mask${i}" pos="${x} ${y} 0.015">
        <freejoint/>
        <!-- main cup -->
        <geom name="mask_cup${i}"    type="sphere" size="0.046"
              rgba="0.97 0.97 0.97 1" mass="0.012"
              friction="0.5 0.1 0.1" solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
        <!-- filter vent circle -->
        <geom name="mask_vent${i}"   type="cylinder" size="0.012 0.003" pos="0 0 0.047"
              rgba="0.72 0.72 0.75 1"/>
        <!-- vent cross H -->
        <geom name="mask_ventH${i}"  type="box" size="0.010 0.002 0.001" pos="0 0 0.051"
              rgba="0.55 0.55 0.58 1"/>
        <!-- vent cross V -->
        <geom name="mask_ventV${i}"  type="box" size="0.002 0.010 0.001" pos="0 0 0.051"
              rgba="0.55 0.55 0.58 1"/>
        <!-- nose wire band -->
        <geom name="mask_nose${i}"   type="box" size="0.028 0.003 0.002" pos="0 0.032 0.042"
              rgba="0.65 0.65 0.68 1"/>
        <!-- left ear strap -->
        <geom name="mask_strapL${i}" type="box" size="0.016 0.003 0.003" pos="-0.040 0.010 0.010"
              quat="0.966 0 0 0.259" rgba="0.88 0.88 0.88 1"/>
        <!-- right ear strap -->
        <geom name="mask_strapR${i}" type="box" size="0.016 0.003 0.003" pos="0.040 0.010 0.010"
              quat="0.966 0 0 -0.259" rgba="0.88 0.88 0.88 1"/>
        <!-- "N95" label strip -->
        <geom name="mask_label${i}"  type="box" size="0.016 0.006 0.001" pos="0 -0.018 0.048"
              rgba="0.10 0.35 0.75 1"/>
      </body>`
  },
  {
    name: 'work_gloves',
    category: 'ppe',
    triggerKeywords: ['earthquake', 'flood', 'hurricane', 'tornado', 'blizzard'],
    rgba: '0.6 0.5 0.3 1',
    xml: (i, x, y) => `
      <body name="work_gloves${i}" pos="${x} ${y} 0.010">
        <freejoint/>
        <!-- left glove palm -->
        <geom name="gl_Lpalm${i}"    type="box" size="0.044 0.055 0.010"
              rgba="0.72 0.60 0.38 1" mass="0.10"
              friction="1.4 0.4 0.1" solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
        <!-- left — finger row bumps (4 knuckle lines) -->
        <geom name="gl_Lfng1${i}"    type="box" size="0.042 0.003 0.003" pos="0 0.038 0.011"
              rgba="0.60 0.48 0.28 1"/>
        <geom name="gl_Lfng2${i}"    type="box" size="0.042 0.003 0.003" pos="0 0.026 0.011"
              rgba="0.60 0.48 0.28 1"/>
        <geom name="gl_Lfng3${i}"    type="box" size="0.042 0.003 0.003" pos="0 0.014 0.011"
              rgba="0.60 0.48 0.28 1"/>
        <!-- left — reinforcement patch (darker suede) -->
        <geom name="gl_Lpatch${i}"   type="box" size="0.022 0.028 0.002" pos="0.010 -0.010 0.011"
              rgba="0.52 0.40 0.22 1"/>
        <!-- right glove palm (offset) -->
        <geom name="gl_Rpalm${i}"    type="box" size="0.044 0.055 0.010" pos="0.100 0 0"
              rgba="0.72 0.60 0.38 1"/>
        <geom name="gl_Rfng1${i}"    type="box" size="0.042 0.003 0.003" pos="0.100 0.038 0.011"
              rgba="0.60 0.48 0.28 1"/>
        <geom name="gl_Rfng2${i}"    type="box" size="0.042 0.003 0.003" pos="0.100 0.026 0.011"
              rgba="0.60 0.48 0.28 1"/>
        <geom name="gl_Rfng3${i}"    type="box" size="0.042 0.003 0.003" pos="0.100 0.014 0.011"
              rgba="0.60 0.48 0.28 1"/>
        <geom name="gl_Rpatch${i}"   type="box" size="0.022 0.028 0.002" pos="0.090 -0.010 0.011"
              rgba="0.52 0.40 0.22 1"/>
        <!-- wrist cuffs -->
        <geom name="gl_LcuffY${i}"   type="box" size="0.044 0.012 0.006" pos="0 -0.060 0.006"
              rgba="0.30 0.25 0.15 1"/>
        <geom name="gl_RcuffY${i}"   type="box" size="0.044 0.012 0.006" pos="0.100 -0.060 0.006"
              rgba="0.30 0.25 0.15 1"/>
      </body>`
  },
  {
    name: 'safety_boots',
    category: 'ppe',
    triggerKeywords: ['earthquake', 'flood', 'wildfire', 'hurricane'],
    rgba: '0.25 0.18 0.12 1',
    xml: (i, x, y) => `
      <body name="safety_boots${i}" pos="${x} ${y} 0.040">
        <freejoint/>
        <!-- left sole -->
        <geom name="sb_Lsole${i}"    type="box" size="0.038 0.088 0.010"
              rgba="0.15 0.10 0.06 1" mass="0.65"
              friction="2.0 0.5 0.1" solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
        <!-- left upper -->
        <geom name="sb_Lupper${i}"   type="box" size="0.034 0.078 0.040" pos="-0.002 0.004 0.030"
              rgba="0.22 0.15 0.09 1"/>
        <!-- left toe cap (steel, lighter grey) -->
        <geom name="sb_Ltoe${i}"     type="box" size="0.034 0.022 0.020" pos="-0.002 0.060 0.035"
              rgba="0.48 0.48 0.52 1"/>
        <!-- left tread lines (3 ridges across sole) -->
        <geom name="sb_Ltrd1${i}"    type="box" size="0.038 0.003 0.003" pos="0 0.030 -0.008"
              rgba="0.08 0.05 0.02 1"/>
        <geom name="sb_Ltrd2${i}"    type="box" size="0.038 0.003 0.003" pos="0 0.000 -0.008"
              rgba="0.08 0.05 0.02 1"/>
        <geom name="sb_Ltrd3${i}"    type="box" size="0.038 0.003 0.003" pos="0 -0.030 -0.008"
              rgba="0.08 0.05 0.02 1"/>
        <!-- left laces row -->
        <geom name="sb_Llace${i}"    type="box" size="0.012 0.040 0.002" pos="0 0.010 0.058"
              rgba="0.88 0.82 0.72 1"/>
        <!-- right boot (offset) -->
        <geom name="sb_Rsole${i}"    type="box" size="0.038 0.088 0.010" pos="0.090 0 0"
              rgba="0.15 0.10 0.06 1"/>
        <geom name="sb_Rupper${i}"   type="box" size="0.034 0.078 0.040" pos="0.088 0.004 0.030"
              rgba="0.22 0.15 0.09 1"/>
        <geom name="sb_Rtoe${i}"     type="box" size="0.034 0.022 0.020" pos="0.088 0.060 0.035"
              rgba="0.48 0.48 0.52 1"/>
        <geom name="sb_Rtrd1${i}"    type="box" size="0.038 0.003 0.003" pos="0.090 0.030 -0.008"
              rgba="0.08 0.05 0.02 1"/>
        <geom name="sb_Rtrd2${i}"    type="box" size="0.038 0.003 0.003" pos="0.090 0.000 -0.008"
              rgba="0.08 0.05 0.02 1"/>
        <geom name="sb_Rlace${i}"    type="box" size="0.012 0.040 0.002" pos="0.090 0.010 0.058"
              rgba="0.88 0.82 0.72 1"/>
      </body>`
  }
];

// ─── EQUIPMENT ───────────────────────────────────────────────────────────────

const equipmentItems: ItemDefinition[] = [
  {
    name: 'flashlight',
    category: 'equipment',
    triggerKeywords: ['earthquake', 'hurricane', 'tornado', 'flood', 'blizzard'],
    rgba: '0.12 0.12 0.12 1',
    xml: (i, x, y) => `
      <body name="flashlight${i}" pos="${x} ${y} 0.015">
        <freejoint/>
        <!-- handle body -->
        <geom name="fl_handle${i}"   type="cylinder" size="0.013 0.065"
              rgba="0.10 0.10 0.10 1" mass="0.20"
              friction="1.5 0.3 0.1" solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
        <!-- knurling band 1 -->
        <geom name="fl_knurl1${i}"   type="cylinder" size="0.0135 0.005" pos="0 0 -0.030"
              rgba="0.22 0.22 0.22 1"/>
        <!-- knurling band 2 -->
        <geom name="fl_knurl2${i}"   type="cylinder" size="0.0135 0.005" pos="0 0 -0.010"
              rgba="0.22 0.22 0.22 1"/>
        <!-- head (flared) -->
        <geom name="fl_head${i}"     type="cylinder" size="0.023 0.024" pos="0 0 0.076"
              rgba="0.15 0.15 0.15 1"/>
        <!-- reflector ring -->
        <geom name="fl_reflector${i}" type="cylinder" size="0.020 0.001" pos="0 0 0.101"
              rgba="0.82 0.78 0.55 1"/>
        <!-- bright lens — white/yellow circle (most visible from top) -->
        <geom name="fl_lens${i}"     type="cylinder" size="0.016 0.002" pos="0 0 0.103"
              rgba="0.98 0.98 0.70 0.95"/>
        <!-- LED centre dot -->
        <geom name="fl_led${i}"      type="sphere"   size="0.005"        pos="0 0 0.106"
              rgba="1 1 0.5 1"/>
        <!-- power button (side, top visible) -->
        <geom name="fl_btn${i}"      type="sphere"   size="0.006"        pos="0 0.014 0.025"
              rgba="0.85 0.12 0.12 1"/>
      </body>`
  },
  {
    name: 'emergency_radio',
    category: 'equipment',
    triggerKeywords: ['earthquake', 'hurricane', 'tornado', 'flood', 'blizzard'],
    rgba: '0.85 0.3 0.1 1',
    xml: (i, x, y) => `
      <body name="emergency_radio${i}" pos="${x} ${y} 0.038">
        <freejoint/>
        <!-- orange body -->
        <geom name="er_body${i}"     type="box" size="0.080 0.048 0.038"
              rgba="0.82 0.26 0.08 1" mass="0.42"
              friction="1.1 0.3 0.1" solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
        <!-- speaker grille (dark inset panel) -->
        <geom name="er_grille${i}"   type="box" size="0.030 0.034 0.001" pos="-0.032 0 0.039"
              rgba="0.15 0.15 0.15 1"/>
        <!-- grille dot rows: 3×4 -->
        <geom name="er_g00${i}"      type="sphere" size="0.003" pos="-0.042 -0.020 0.040" rgba="0.35 0.35 0.35 1"/>
        <geom name="er_g01${i}"      type="sphere" size="0.003" pos="-0.042 -0.008 0.040" rgba="0.35 0.35 0.35 1"/>
        <geom name="er_g02${i}"      type="sphere" size="0.003" pos="-0.042  0.008 0.040" rgba="0.35 0.35 0.35 1"/>
        <geom name="er_g03${i}"      type="sphere" size="0.003" pos="-0.042  0.020 0.040" rgba="0.35 0.35 0.35 1"/>
        <geom name="er_g10${i}"      type="sphere" size="0.003" pos="-0.034 -0.020 0.040" rgba="0.35 0.35 0.35 1"/>
        <geom name="er_g11${i}"      type="sphere" size="0.003" pos="-0.034 -0.008 0.040" rgba="0.35 0.35 0.35 1"/>
        <geom name="er_g12${i}"      type="sphere" size="0.003" pos="-0.034  0.008 0.040" rgba="0.35 0.35 0.35 1"/>
        <geom name="er_g13${i}"      type="sphere" size="0.003" pos="-0.034  0.020 0.040" rgba="0.35 0.35 0.35 1"/>
        <geom name="er_g20${i}"      type="sphere" size="0.003" pos="-0.026 -0.020 0.040" rgba="0.35 0.35 0.35 1"/>
        <geom name="er_g21${i}"      type="sphere" size="0.003" pos="-0.026 -0.008 0.040" rgba="0.35 0.35 0.35 1"/>
        <geom name="er_g22${i}"      type="sphere" size="0.003" pos="-0.026  0.008 0.040" rgba="0.35 0.35 0.35 1"/>
        <geom name="er_g23${i}"      type="sphere" size="0.003" pos="-0.026  0.020 0.040" rgba="0.35 0.35 0.35 1"/>
        <!-- display / tuning panel -->
        <geom name="er_disp${i}"     type="box" size="0.026 0.026 0.001" pos="0.030 0.008 0.039"
              rgba="0.08 0.25 0.08 1"/>
        <!-- tuning dial -->
        <geom name="er_dial${i}"     type="cylinder" size="0.010 0.004" pos="0.060 -0.018 0.040"
              rgba="0.22 0.22 0.22 1"/>
        <!-- dial tick mark -->
        <geom name="er_tick${i}"     type="box" size="0.002 0.010 0.001" pos="0.060 -0.018 0.045"
              rgba="0.88 0.72 0.18 1"/>
        <!-- antenna -->
        <geom name="er_ant${i}"      type="cylinder" size="0.003 0.045" pos="0.072 0.040 0.075"
              rgba="0.30 0.30 0.32 1"/>
      </body>`
  },
  {
    name: 'emergency_whistle',
    category: 'equipment',
    triggerKeywords: ['earthquake', 'flood', 'hurricane', 'tornado'],
    rgba: '1 0.7 0 1',
    xml: (i, x, y) => `
      <body name="emergency_whistle${i}" pos="${x} ${y} 0.008">
        <freejoint/>
        <!-- bright yellow body -->
        <geom name="ew_body${i}"     type="box" size="0.020 0.040 0.008"
              rgba="1.0 0.68 0.02 1" mass="0.013"
              friction="0.9 0.2 0.1" solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
        <!-- mouthpiece -->
        <geom name="ew_mouth${i}"    type="cylinder" size="0.007 0.008" pos="0 -0.042 0"
              rgba="1.0 0.68 0.02 1"/>
        <!-- mouth hole (dark) -->
        <geom name="ew_hole${i}"     type="cylinder" size="0.004 0.002" pos="0 -0.042 0.010"
              rgba="0.15 0.12 0.05 1"/>
        <!-- vent slot 1 -->
        <geom name="ew_vent1${i}"    type="box" size="0.014 0.003 0.001" pos="0 0.008 0.009"
              rgba="0.30 0.22 0.02 1"/>
        <!-- vent slot 2 -->
        <geom name="ew_vent2${i}"    type="box" size="0.014 0.003 0.001" pos="0 -0.002 0.009"
              rgba="0.30 0.22 0.02 1"/>
        <!-- lanyard ring -->
        <geom name="ew_ring${i}"     type="cylinder" size="0.004 0.003" pos="0 0.044 0.006"
              rgba="0.75 0.75 0.78 1"/>
      </body>`
  }
];

// ─── TOOLS ────────────────────────────────────────────────────────────────────

const toolsItems: ItemDefinition[] = [
  {
    name: 'shovel',
    category: 'tools',
    triggerKeywords: ['earthquake', 'flood', 'hurricane', 'blizzard'],
    rgba: '0.6 0.38 0.15 1',
    xml: (i, x, y) => `
      <body name="shovel${i}" pos="${x} ${y} 0.012">
        <freejoint/>
        <!-- wooden handle -->
        <geom name="sh_handle${i}"   type="cylinder" size="0.012 0.220"
              rgba="0.62 0.40 0.18 1" mass="0.55"
              friction="1.0 0.3 0.1" solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"
              quat="0.707 0 0.707 0"/>
        <!-- handle grip wrap (darker band) -->
        <geom name="sh_grip${i}"     type="cylinder" size="0.0135 0.040" pos="0 -0.170 0"
              rgba="0.38 0.24 0.10 1"
              quat="0.707 0 0.707 0"/>
        <!-- grip texture lines -->
        <geom name="sh_grp1${i}"     type="box" size="0.0135 0.004 0.040" pos="0 -0.170 0"
              rgba="0.28 0.18 0.08 1"/>
        <!-- neck collar (steel) -->
        <geom name="sh_collar${i}"   type="cylinder" size="0.016 0.008" pos="0 0.210 0"
              rgba="0.55 0.55 0.58 1"
              quat="0.707 0 0.707 0"/>
        <!-- blade — main face -->
        <geom name="sh_blade${i}"    type="box" size="0.070 0.090 0.005" pos="0 0.310 0"
              rgba="0.62 0.62 0.65 1"/>
        <!-- blade — centre rib (raised ridge) -->
        <geom name="sh_rib${i}"      type="box" size="0.008 0.080 0.008" pos="0 0.306 0"
              rgba="0.52 0.52 0.55 1"/>
        <!-- blade shine strip -->
        <geom name="sh_shine${i}"    type="box" size="0.003 0.070 0.001" pos="-0.025 0.306 0.006"
              rgba="0.88 0.88 0.90 1"/>
        <!-- D-handle ring -->
        <geom name="sh_dring${i}"    type="cylinder" size="0.018 0.006" pos="0 -0.210 0"
              rgba="0.58 0.38 0.14 1"
              quat="0.707 0 0.707 0"/>
      </body>`
  },
  {
    name: 'multi_tool',
    category: 'tools',
    triggerKeywords: ['earthquake', 'hurricane', 'tornado', 'flood', 'blizzard'],
    rgba: '0.5 0.5 0.5 1',
    xml: (i, x, y) => `
      <body name="multi_tool${i}" pos="${x} ${y} 0.010">
        <freejoint/>
        <!-- handle half 1 -->
        <geom name="mt_h1${i}"       type="box" size="0.016 0.054 0.010"
              rgba="0.48 0.48 0.52 1" mass="0.18"
              friction="1.2 0.3 0.1" solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
        <!-- handle half 2 (mirrored, offset) -->
        <geom name="mt_h2${i}"       type="box" size="0.016 0.054 0.010" pos="0.005 0 0"
              rgba="0.42 0.42 0.46 1"/>
        <!-- plier jaw 1 -->
        <geom name="mt_j1${i}"       type="box" size="0.018 0.014 0.008" pos="-0.005 0.060 0.001"
              rgba="0.60 0.60 0.62 1"/>
        <!-- plier jaw 2 -->
        <geom name="mt_j2${i}"       type="box" size="0.018 0.014 0.008" pos="0.010 0.060 0.001"
              rgba="0.60 0.60 0.62 1"/>
        <!-- jaw serration lines -->
        <geom name="mt_js1${i}"      type="box" size="0.018 0.002 0.001" pos="0.002 0.058 0.010"
              rgba="0.30 0.30 0.32 1"/>
        <geom name="mt_js2${i}"      type="box" size="0.018 0.002 0.001" pos="0.002 0.063 0.010"
              rgba="0.30 0.30 0.32 1"/>
        <!-- pivot rivet -->
        <geom name="mt_rivet${i}"    type="cylinder" size="0.004 0.002" pos="0.002 0.050 0.011"
              rgba="0.78 0.75 0.62 1"/>
        <!-- logo indent strip -->
        <geom name="mt_logo${i}"     type="box" size="0.010 0.020 0.001" pos="0.002 0.010 0.011"
              rgba="0.32 0.32 0.35 1"/>
        <!-- clip wing -->
        <geom name="mt_clip${i}"     type="box" size="0.004 0.044 0.004" pos="-0.020 -0.004 0.005"
              rgba="0.55 0.55 0.58 1"/>
      </body>`
  },
  {
    name: 'duct_tape_roll',
    category: 'tools',
    triggerKeywords: ['hurricane', 'earthquake', 'tornado', 'flood'],
    rgba: '0.45 0.45 0.48 1',
    xml: (i, x, y) => `
      <body name="duct_tape_roll${i}" pos="${x} ${y} 0.022">
        <freejoint/>
        <!-- outer tape ring -->
        <geom name="dt_outer${i}"    type="cylinder" size="0.050 0.022"
              rgba="0.42 0.42 0.46 1" mass="0.28"
              friction="1.5 0.5 0.1" solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
        <!-- cardboard inner core -->
        <geom name="dt_core${i}"     type="cylinder" size="0.020 0.023"
              rgba="0.78 0.65 0.42 1"/>
        <!-- core hole (dark) -->
        <geom name="dt_hole${i}"     type="cylinder" size="0.014 0.024"
              rgba="0.18 0.14 0.10 1"/>
        <!-- tape edge top face (silver sheen) -->
        <geom name="dt_top${i}"      type="cylinder" size="0.050 0.001" pos="0 0 0.023"
              rgba="0.60 0.60 0.64 0.85"/>
        <!-- tape texture lines (radial, top-visible) -->
        <geom name="dt_tex1${i}"     type="box" size="0.050 0.002 0.001" pos="0 0 0.024"
              rgba="0.35 0.35 0.38 0.6"/>
        <geom name="dt_tex2${i}"     type="box" size="0.002 0.050 0.001" pos="0 0 0.024"
              rgba="0.35 0.35 0.38 0.6"/>
        <!-- tear tab (slightly protruding strip) -->
        <geom name="dt_tab${i}"      type="box" size="0.012 0.006 0.004" pos="0.048 0 0.018"
              rgba="0.55 0.55 0.58 1"/>
      </body>`
  }
];

// ─── BLANKETS ────────────────────────────────────────────────────────────────

const blanketItems: ItemDefinition[] = [
  {
    name: 'emergency_blanket',
    category: 'blankets',
    triggerKeywords: ['blizzard', 'earthquake', 'hurricane', 'flood'],
    rgba: '0.85 0.85 0.9 0.8',
    xml: (i, x, y) => `
      <body name="emergency_blanket${i}" pos="${x} ${y} 0.004">
        <joint type="free"/>
        <!-- mylar sheet base (gold/silver reflective) -->
        <geom name="eb_sheet${i}"    type="box" size="0.058 0.078 0.004"
              rgba="0.88 0.82 0.45 0.88" mass="0.06"
              friction="0.5 0.1 0.05" solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
        <!-- reflective sheen overlay -->
        <geom name="eb_sheen${i}"    type="box" size="0.055 0.075 0.001" pos="0 0 0.005"
              rgba="0.98 0.95 0.70 0.55"/>
        <!-- fold crease lines (horizontal) -->
        <geom name="eb_fold1${i}"    type="box" size="0.058 0.002 0.001" pos="0  0.026 0.005"
              rgba="0.65 0.60 0.30 0.8"/>
        <geom name="eb_fold2${i}"    type="box" size="0.058 0.002 0.001" pos="0 -0.026 0.005"
              rgba="0.65 0.60 0.30 0.8"/>
        <!-- fold crease lines (vertical) -->
        <geom name="eb_fold3${i}"    type="box" size="0.002 0.078 0.001" pos=" 0.019 0 0.005"
              rgba="0.65 0.60 0.30 0.8"/>
        <geom name="eb_fold4${i}"    type="box" size="0.002 0.078 0.001" pos="-0.019 0 0.005"
              rgba="0.65 0.60 0.30 0.8"/>
        <!-- red "EMERGENCY" label band -->
        <geom name="eb_label${i}"    type="box" size="0.038 0.008 0.001" pos="0 0.062 0.006"
              rgba="0.85 0.10 0.10 1"/>
        <!-- white text strip inside label -->
        <geom name="eb_ltxt${i}"     type="box" size="0.030 0.004 0.001" pos="0 0.062 0.007"
              rgba="1 1 1 0.9"/>
      </body>`
  }
];

// ─── HYGIENE ─────────────────────────────────────────────────────────────────

const hygieneItems: ItemDefinition[] = [
  {
    name: 'hand_sanitizer',
    category: 'hygiene',
    triggerKeywords: ['pandemic', 'flood', 'earthquake', 'hurricane'],
    rgba: '0.7 0.95 0.7 0.8',
    xml: (i, x, y) => `
      <body name="hand_sanitizer${i}" pos="${x} ${y} 0.055">
        <joint type="free"/>
        <!-- green-tinted bottle body -->
        <geom name="hs_body${i}"     type="cylinder" size="0.022 0.054"
              rgba="0.58 0.90 0.60 0.78" mass="0.09"
              friction="1.1 0.3 0.1" solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
        <!-- white label band (larger radius, visible) -->
        <geom name="hs_label${i}"    type="cylinder" size="0.0235 0.028" pos="0 0 -0.008"
              rgba="1 1 1 0.95"/>
        <!-- label logo cross H -->
        <geom name="hs_crossH${i}"   type="box" size="0.014 0.004 0.001" pos="0 0 -0.002"
              rgba="0.12 0.58 0.22 1"/>
        <!-- label logo cross V -->
        <geom name="hs_crossV${i}"   type="box" size="0.004 0.014 0.001" pos="0 0 -0.002"
              rgba="0.12 0.58 0.22 1"/>
        <!-- text lines below logo -->
        <geom name="hs_tl1${i}"      type="box" size="0.016 0.003 0.001" pos="0 0 -0.012"
              rgba="0.18 0.18 0.18 0.8"/>
        <geom name="hs_tl2${i}"      type="box" size="0.012 0.003 0.001" pos="0 0 -0.018"
              rgba="0.18 0.18 0.18 0.5"/>
        <!-- pump neck shoulder -->
        <geom name="hs_neck${i}"     type="cylinder" size="0.010 0.012" pos="0 0 0.062"
              rgba="0.25 0.62 0.28 1"/>
        <!-- pump nozzle top cap -->
        <geom name="hs_pump${i}"     type="cylinder" size="0.014 0.006" pos="0 0 0.076"
              rgba="0.20 0.55 0.22 1"/>
        <!-- nozzle head (visible from top) -->
        <geom name="hs_nozzle${i}"   type="box" size="0.006 0.014 0.004" pos="0 0 0.083"
              rgba="0.18 0.48 0.20 1"/>
      </body>`
  },
  {
    name: 'soap_bar',
    category: 'hygiene',
    triggerKeywords: ['flood', 'earthquake', 'hurricane', 'pandemic'],
    rgba: '0.9 0.9 1 1',
    xml: (i, x, y) => `
      <body name="soap_bar${i}" pos="${x} ${y} 0.013">
        <joint type="free"/>
        <!-- soap body (slightly rounded look via layering) -->
        <geom name="soap_base${i}"   type="box" size="0.040 0.028 0.013"
              rgba="0.92 0.90 0.98 1" mass="0.11"
              friction="0.35 0.08 0.08" solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
        <!-- chamfered top (slightly inset) -->
        <geom name="soap_top${i}"    type="box" size="0.036 0.024 0.001" pos="0 0 0.014"
              rgba="0.98 0.96 1 1"/>
        <!-- brand imprint bar -->
        <geom name="soap_brand${i}"  type="box" size="0.022 0.008 0.001" pos="0 0.006 0.015"
              rgba="0.72 0.68 0.88 1"/>
        <!-- brand imprint text lines -->
        <geom name="soap_bl1${i}"    type="box" size="0.018 0.002 0.001" pos="0 0.006 0.016"
              rgba="0.55 0.50 0.75 1"/>
        <!-- wave pattern line 1 -->
        <geom name="soap_w1${i}"     type="box" size="0.032 0.002 0.001" pos="0 -0.006 0.015"
              rgba="0.72 0.68 0.88 0.7"/>
        <!-- wave pattern line 2 -->
        <geom name="soap_w2${i}"     type="box" size="0.028 0.002 0.001" pos="0 -0.012 0.015"
              rgba="0.72 0.68 0.88 0.5"/>
        <!-- wave pattern line 3 -->
        <geom name="soap_w3${i}"     type="box" size="0.024 0.002 0.001" pos="0 -0.018 0.015"
              rgba="0.72 0.68 0.88 0.35"/>
      </body>`
  },
  {
    name: 'toothbrush_toothpaste',
    category: 'hygiene',
    triggerKeywords: ['flood', 'earthquake', 'hurricane'],
    rgba: '0.4 0.7 1 1',
    xml: (i, x, y) => `
      <body name="toothbrush_set${i}" pos="${x} ${y} 0.006">
        <joint type="free"/>
        <!-- toothbrush handle -->
        <geom name="tb_handle${i}"   type="box" size="0.008 0.072 0.006"
              rgba="0.18 0.55 0.90 1" mass="0.022"
              friction="0.8 0.2 0.1" solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
        <!-- grip indent zones -->
        <geom name="tb_grip${i}"     type="box" size="0.008 0.030 0.005" pos="0 -0.018 0"
              rgba="0.14 0.45 0.78 1"/>
        <!-- rubber grip dots -->
        <geom name="tb_rd1${i}"      type="sphere" size="0.003" pos="0 -0.010 0.007" rgba="0.08 0.35 0.65 1"/>
        <geom name="tb_rd2${i}"      type="sphere" size="0.003" pos="0 -0.022 0.007" rgba="0.08 0.35 0.65 1"/>
        <!-- head -->
        <geom name="tb_head${i}"     type="box" size="0.007 0.016 0.005" pos="0 0.076 0"
              rgba="0.22 0.62 0.95 1"/>
        <!-- bristle rows (6 small white boxes) -->
        <geom name="tb_br1${i}"      type="box" size="0.005 0.002 0.003" pos="-0.002 0.068 0.007" rgba="1 1 1 1"/>
        <geom name="tb_br2${i}"      type="box" size="0.005 0.002 0.003" pos="-0.002 0.074 0.007" rgba="1 1 1 1"/>
        <geom name="tb_br3${i}"      type="box" size="0.005 0.002 0.003" pos="-0.002 0.080 0.007" rgba="1 1 1 1"/>
        <geom name="tb_br4${i}"      type="box" size="0.005 0.002 0.003" pos="0.002  0.068 0.007" rgba="0.45 0.85 1 1"/>
        <geom name="tb_br5${i}"      type="box" size="0.005 0.002 0.003" pos="0.002  0.074 0.007" rgba="0.45 0.85 1 1"/>
        <geom name="tb_br6${i}"      type="box" size="0.005 0.002 0.003" pos="0.002  0.080 0.007" rgba="0.45 0.85 1 1"/>
        <!-- toothpaste tube (alongside) -->
        <geom name="tp_tube${i}"     type="box" size="0.014 0.058 0.008" pos="0.032 0.010 0"
              rgba="0.96 0.96 0.96 1"/>
        <!-- tube colour stripe -->
        <geom name="tp_stripe${i}"   type="box" size="0.014 0.058 0.001" pos="0.032 0.010 0.009"
              rgba="0.18 0.55 0.90 1"/>
        <!-- tube logo box -->
        <geom name="tp_logo${i}"     type="box" size="0.010 0.018 0.001" pos="0.032 0.016 0.010"
              rgba="1 1 1 0.9"/>
        <!-- tube crimp end -->
        <geom name="tp_crimp${i}"    type="box" size="0.014 0.008 0.006" pos="0.032 -0.058 0.001"
              rgba="0.80 0.80 0.80 1"/>
        <!-- tube cap -->
        <geom name="tp_cap${i}"      type="cylinder" size="0.008 0.006" pos="0.032 0.068 0.002"
              rgba="0.18 0.55 0.90 1"/>
      </body>`
  },
  {
    name: 'sunscreen_tube',
    category: 'hygiene',
    triggerKeywords: ['wildfire', 'heat', 'earthquake', 'flood'],
    rgba: '1 0.88 0.2 1',
    xml: (i, x, y) => `
      <body name="sunscreen_tube${i}" pos="${x} ${y} 0.013">
        <joint type="free"/>
        <!-- bright yellow squeeze tube -->
        <geom name="sc_tube${i}"     type="box" size="0.018 0.065 0.013"
              rgba="0.98 0.85 0.08 1" mass="0.065"
              friction="0.9 0.2 0.1" solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
        <!-- white front label panel -->
        <geom name="sc_panel${i}"    type="box" size="0.014 0.048 0.001" pos="0 0.004 0.014"
              rgba="1 1 1 0.95"/>
        <!-- SPF number (dark text sim: two bars) -->
        <geom name="sc_spf1${i}"     type="box" size="0.012 0.006 0.001" pos="0 0.016 0.015"
              rgba="0.12 0.12 0.12 1"/>
        <geom name="sc_spf2${i}"     type="box" size="0.010 0.004 0.001" pos="0 0.006 0.015"
              rgba="0.25 0.25 0.25 0.8"/>
        <!-- sun icon: circle -->
        <geom name="sc_sun${i}"      type="cylinder" size="0.006 0.001" pos="0 -0.008 0.015"
              rgba="0.98 0.72 0.02 1"/>
        <!-- sun rays (4 short spokes) -->
        <geom name="sc_ray1${i}"     type="box" size="0.010 0.002 0.001" pos="0 -0.008 0.016"
              rgba="0.98 0.72 0.02 1"/>
        <geom name="sc_ray2${i}"     type="box" size="0.002 0.010 0.001" pos="0 -0.008 0.016"
              rgba="0.98 0.72 0.02 1"/>
        <!-- brand line -->
        <geom name="sc_brand${i}"    type="box" size="0.012 0.004 0.001" pos="0 -0.022 0.015"
              rgba="0.85 0.55 0.02 1"/>
        <!-- orange flip cap -->
        <geom name="sc_cap${i}"      type="box" size="0.018 0.014 0.012" pos="0 0.072 0.005"
              rgba="0.95 0.52 0.04 1"/>
        <!-- cap hinge line -->
        <geom name="sc_hinge${i}"    type="box" size="0.018 0.002 0.002" pos="0 0.065 0.012"
              rgba="0.72 0.38 0.02 1"/>
        <!-- bottom crimp -->
        <geom name="sc_crimp${i}"    type="box" size="0.018 0.008 0.008" pos="0 -0.068 0.004"
              rgba="0.85 0.72 0.04 1"/>
      </body>`
  }
];

// ─── AGGREGATED EXPORTS ──────────────────────────────────────────────────────

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

export const itemCatalog: CatalogEntry[] = allItems.map(
  ({ name, category, triggerKeywords }) => ({ name, category, triggerKeywords })
);

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