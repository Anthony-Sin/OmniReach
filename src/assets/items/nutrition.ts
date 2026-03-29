/**
 * @category    Nutrition
 * @description Detailed food and nutrition survival items.
 */

export const foodNutritionItems = [
    {
        name: 'mre_pouch',
        category: 'food_nutrition',
        triggerKeywords: ['Earthquake', 'Flood', 'Food Security', 'Displacement'],
        rgba: '0.35 0.32 0.18 1',
        xml: (i: number, x: number, y: number) => `
        <body name="mre_pouch${i}" pos="${x} ${y} 0.025">
            <freejoint/>
            <!-- Main retort pouch: ~15cm x 20cm x 3cm -->
            <geom name="mre_body${i}" type="box" size="0.075 0.1 0.012" rgba="0.33 0.30 0.16 1" mass="0.680" friction="0.9 0.2 0.05" material="plastic_mat" solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
            
            <!-- Fill bulge for realism (Simulating uneven contents) -->
            <geom type="box" size="0.065 0.085 0.018" pos="0 0 0.002" rgba="0.35 0.32 0.18 0.9" material="plastic_mat"/>
            <geom type="box" size="0.055 0.075 0.022" pos="0.005 -0.005 0.003" rgba="0.35 0.32 0.18 0.8" material="plastic_mat"/>
            
            <!-- Heat seals at top and bottom (Reinforced edges) -->
            <geom type="box" size="0.076 0.008 0.013" pos="0 0.1 0" rgba="0.28 0.25 0.12 1" material="plastic_mat"/>
            <geom type="box" size="0.076 0.008 0.013" pos="0 -0.1 0" rgba="0.28 0.25 0.12 1" material="plastic_mat"/>
            
            <!-- Tear notch detail -->
            <geom type="box" size="0.006 0.002 0.014" pos="0.068 0.1 0" rgba="0.1 0.1 0.1 1"/>
            
            <!-- Label details: Nutrition facts and branding -->
            <geom type="box" size="0.06 0.001 0.08" pos="0 0.101 0" material="food_label_mat"/>
            
            <!-- Branding & Logo -->
            <body name="mre_logo_${i}" pos="0.03 0.102 0.04">
                <geom type="box" size="0.015 0.001 0.015" rgba="0.8 0.2 0.1 1"/> <!-- Red Logo Block -->
                <geom type="box" size="0.01 0.001 0.002" pos="0 0 0.01" rgba="1 1 1 1"/> <!-- Logo detail -->
            </body>
            
            <!-- Main Title & Text -->
            <geom type="box" size="0.05 0.0012 0.008" pos="-0.01 0.102 0.06" rgba="0.1 0.1 0.1 1"/> <!-- Title -->
            <geom type="box" size="0.04 0.0012 0.002" pos="-0.01 0.102 0.04" rgba="0.2 0.2 0.2 1"/> <!-- Subtitle -->
            
            <!-- Nutrition Facts Panel (Simulated) -->
            <body name="mre_facts_${i}" pos="-0.02 0.102 -0.03">
                <geom type="box" size="0.03 0.001 0.04" rgba="0.95 0.95 0.95 1"/> <!-- Panel background -->
                <geom type="box" size="0.025 0.0012 0.002" pos="0 0 0.035" rgba="0 0 0 1"/> <!-- Header -->
                <geom type="box" size="0.025 0.0012 0.001" pos="0 0 0.025" rgba="0.3 0.3 0.3 1"/> <!-- Line -->
                <geom type="box" size="0.025 0.0012 0.001" pos="0 0 0.02" rgba="0.3 0.3 0.3 1"/>
                <geom type="box" size="0.025 0.0012 0.001" pos="0 0 0.015" rgba="0.3 0.3 0.3 1"/>
            </body>
        </body>`
    },
    {
        name: 'ors_sachet',
        category: 'food_nutrition',
        triggerKeywords: ['Flood', 'Disease', 'Outbreak', 'Heat'],
        rgba: '0.96 0.96 0.90 1',
        xml: (i: number, x: number, y: number) => `
        <body name="ors_sachet${i}" pos="${x} ${y} 0.005">
            <freejoint/>
            <!-- Foil sachet: ~8cm x 12cm x 0.5cm -->
            <geom name="ors_body${i}" type="box" size="0.04 0.06 0.002" rgba="0.9 0.95 0.8 1" mass="0.028" friction="0.8 0.2 0.05" material="plastic_mat" solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
            
            <!-- Crinkled texture effect (Subtle layers) -->
            <geom type="box" size="0.038 0.058 0.0025" pos="0.001 0.001 0.0005" euler="0 0 1" rgba="0.8 0.9 0.7 0.5" material="plastic_mat"/>
            <geom type="box" size="0.038 0.058 0.0025" pos="-0.001 -0.001 0.0005" euler="0 0 -1" rgba="0.8 0.9 0.7 0.5" material="plastic_mat"/>
            
            <!-- Seal borders (Crimp pattern) -->
            <geom type="box" size="0.041 0.005 0.003" pos="0 0.06 0" rgba="0.82 0.82 0.76 1" material="plastic_mat"/>
            <geom type="box" size="0.041 0.005 0.003" pos="0 -0.06 0" rgba="0.82 0.82 0.76 1" material="plastic_mat"/>
            
            <!-- Tear notch -->
            <geom type="box" size="0.004 0.002 0.004" pos="0.036 0.06 0" rgba="0.4 0.4 0.4 1"/>
            
            <!-- Labeling: Medical/Hydration info -->
            <geom type="box" size="0.035 0.0005 0.05" pos="0 0.061 0" material="medical_label_mat"/>
            
            <!-- Header & Branding -->
            <body name="ors_header_${i}" pos="0 0.062 0.035">
                <geom type="box" size="0.03 0.0006 0.01" rgba="0.1 0.4 0.8 1"/> <!-- Blue Header -->
                <geom type="box" size="0.02 0.0006 0.003" pos="0 0 0.002" rgba="1 1 1 1"/> <!-- Title text block -->
            </body>
            
            <!-- Instructions & Details -->
            <body name="ors_text_${i}" pos="0 0.062 -0.01">
                <geom type="box" size="0.025 0.0006 0.0015" pos="0 0 0.02" rgba="0.2 0.2 0.2 1"/>
                <geom type="box" size="0.025 0.0006 0.0015" pos="0 0 0.015" rgba="0.2 0.2 0.2 1"/>
                <geom type="box" size="0.025 0.0006 0.0015" pos="0 0 0.01" rgba="0.2 0.2 0.2 1"/>
                
                <!-- Flavor/Type indicator -->
                <geom type="box" size="0.01 0.0006 0.005" pos="0.02 0 -0.02" rgba="1 0.6 0.1 1"/> <!-- Orange indicator -->
            </body>
        </body>`
    }
];
