/**
 * @category    Equipment
 * @description Detailed survival equipment and shelter items.
 */

export const equipmentItems = [
    {
        name: 'cat_tourniquet',
        category: 'chaos',
        triggerKeywords: ['War', 'Explosion'],
        rgba: '0.82 0.65 0.10 1',
        xml: (i: number, x: number, y: number) => `
        <body name="cat_tourniquet${i}" pos="${x} ${y} 0.01">
            <freejoint/>
            <!-- Nylon webbing: ~15cm x 5cm x 1cm folded -->
            <!-- Main folded band -->
            <geom name="cat_band${i}" type="box" size="0.075 0.025 0.006" rgba="0.1 0.1 0.1 1" mass="0.086" friction="2.0 0.5 0.1" material="fabric_mat"/>
            
            <!-- Secondary fold (slightly offset) -->
            <geom type="box" size="0.07 0.023 0.002" pos="0.002 0.001 0.007" rgba="0.15 0.15 0.15 1" material="fabric_mat"/>
            
            <!-- Buckle (Plastic with slot detail) -->
            <body name="cat_buckle_body${i}" pos="0.06 0 0.005">
                <geom name="cat_buckle${i}" type="box" size="0.015 0.022 0.008" rgba="0.05 0.05 0.05 1" material="plastic_mat"/>
                <geom type="box" size="0.01 0.018 0.009" pos="0.002 0 0" rgba="0 0 0 1"/> <!-- Slot -->
            </body>
            
            <!-- Windlass rod (Plastic/Composite with textured grip) -->
            <body name="cat_windlass_body${i}" pos="0 0 0.015" quat="0.707 0 0.707 0">
                <geom name="cat_windlass_rod${i}" type="cylinder" size="0.006 0.06" rgba="0.1 0.1 0.1 1" material="plastic_mat"/>
                <!-- Grip ribs -->
                <geom type="cylinder" size="0.0065 0.002" pos="0 0 0.04" rgba="0.05 0.05 0.05 1"/>
                <geom type="cylinder" size="0.0065 0.002" pos="0 0 0.02" rgba="0.05 0.05 0.05 1"/>
                <geom type="cylinder" size="0.0065 0.002" pos="0 0 0" rgba="0.05 0.05 0.05 1"/>
                <geom type="cylinder" size="0.0065 0.002" pos="0 0 -0.02" rgba="0.05 0.05 0.05 1"/>
                <geom type="cylinder" size="0.0065 0.002" pos="0 0 -0.04" rgba="0.05 0.05 0.05 1"/>
            </body>
            
            <!-- Windlass clip (C-clamp shape) -->
            <body name="cat_clip_body${i}" pos="-0.04 0 0.01">
                <geom type="box" size="0.012 0.032 0.006" rgba="0.1 0.1 0.1 1" material="plastic_mat"/>
                <geom type="box" size="0.01 0.028 0.007" pos="0 0 0.001" rgba="0 0 0 1"/> <!-- Recess -->
            </body>
            
            <!-- TIME Label (White Velcro with simulated text) -->
            <geom name="cat_time_label${i}" type="box" size="0.025 0.015 0.001" pos="-0.04 0 0.017" rgba="0.95 0.95 0.95 1" material="medical_label_mat"/>
            <geom type="box" size="0.015 0.002 0.0001" pos="-0.04 0.005 0.0175" rgba="0.1 0.1 0.1 1"/> <!-- "TIME:" -->
            <geom type="box" size="0.018 0.001 0.0001" pos="-0.04 -0.005 0.0175" rgba="0.3 0.3 0.3 1"/> <!-- Line -->
        </body>`
    },
    {
        name: 'duct_tape',
        category: 'chaos',
        triggerKeywords: ['Shelter Damage'],
        rgba: '0.18 0.18 0.20 1',
        xml: (i: number, x: number, y: number) => `
        <body name="duct_tape${i}" pos="${x} ${y} 0.025">
            <freejoint/>
            <!-- Tape roll: ~12cm diameter, ~5cm width -->
            <!-- Main roll body -->
            <geom name="tape_outer${i}" type="cylinder" size="0.06 0.025" rgba="0.7 0.7 0.7 1" mass="0.4" friction="1.4 0.3 0.1" material="tool_metal_mat"/>
            
            <!-- Layered effect (slightly smaller cylinder for texture) -->
            <geom type="cylinder" size="0.059 0.0252" rgba="0.65 0.65 0.65 1" material="tool_metal_mat"/>
            
            <!-- Cardboard core -->
            <geom name="tape_core${i}" type="cylinder" size="0.04 0.026" rgba="0.6 0.5 0.4 1" material="box_cardboard_mat"/>
            
            <!-- Inner core label/text -->
            <geom type="cylinder" size="0.0405 0.015" rgba="0.9 0.9 0.9 1" material="food_label_mat"/>
            <geom type="box" size="0.02 0.001 0.01" pos="0 0.0406 0" euler="90 0 0" rgba="0.1 0.1 0.1 1"/> <!-- Brand on core -->
            
            <!-- Outer edge detail (the "start" of the tape) -->
            <geom type="box" size="0.001 0.025 0.01" pos="0.06 0 0" rgba="0.8 0.8 0.8 1"/>
        </body>`
    },
    {
        name: 'solar_crank_radio',
        category: 'chaos',
        triggerKeywords: ['Communications Blackout'],
        rgba: '0.15 0.30 0.15 1',
        xml: (i: number, x: number, y: number) => `
        <body name="solar_crank_radio${i}" pos="${x} ${y} 0.04">
            <freejoint/>
            <!-- Radio body: ~15cm x 8cm x 5cm -->
            <geom name="radio_body${i}" type="box" size="0.075 0.04 0.025" rgba="0.8 0.2 0.1 1" mass="0.340" friction="1.6 0.4 0.1" material="plastic_mat"/>
            
            <!-- Rubberized corners -->
            <geom type="box" size="0.01 0.041 0.026" pos="0.066 0 0" rgba="0.1 0.1 0.1 1"/>
            <geom type="box" size="0.01 0.041 0.026" pos="-0.066 0 0" rgba="0.1 0.1 0.1 1"/>
            
            <!-- Solar panel (Top) -->
            <geom name="radio_solar${i}" type="box" size="0.06 0.03 0.002" pos="0 0 0.026" rgba="0.05 0.05 0.15 1" material="plastic_mat"/>
            <geom type="box" size="0.055 0.025 0.0001" pos="0 0 0.0281" rgba="0.1 0.1 0.3 0.5"/> <!-- Grid sheen -->
            
            <!-- Crank handle (Side) -->
            <body name="radio_crank_body${i}" pos="0.076 0.01 0">
                <geom name="radio_crank_arm${i}" type="box" size="0.005 0.03 0.005" rgba="0.2 0.2 0.2 1" material="plastic_mat"/>
                <geom type="cylinder" size="0.008 0.005" pos="0 0.025 0.005" euler="0 90 0" rgba="0.1 0.1 0.1 1"/> <!-- Knob -->
            </body>
            
            <!-- Antenna (Telescopic) -->
            <body name="radio_antenna_body${i}" pos="0.06 -0.03 0.025">
                <geom name="radio_antenna_base${i}" type="cylinder" size="0.004 0.01" rgba="0.3 0.3 0.3 1"/>
                <geom name="radio_antenna_rod${i}" type="cylinder" size="0.002 0.08" pos="0 0 0.08" rgba="0.8 0.8 0.8 1" material="tool_metal_mat"/>
                <geom type="sphere" size="0.004" pos="0 0 0.16" rgba="0.8 0.8 0.8 1"/> <!-- Tip -->
            </body>
            
            <!-- Speaker grille (Front) -->
            <geom type="box" size="0.035 0.002 0.035" pos="-0.03 0.04 0" rgba="0.1 0.1 0.1 1"/>
            <geom type="box" size="0.032 0.0001 0.032" pos="-0.03 0.0421 0" rgba="0.2 0.2 0.2 1" material="tool_metal_mat"/> <!-- Mesh texture -->
            
            <!-- Tuning Dial & Controls -->
            <geom type="cylinder" size="0.012 0.005" pos="0.03 0.04 0.01" euler="90 0 0" rgba="0.9 0.9 0.9 1" material="plastic_mat"/>
            <geom type="box" size="0.008 0.001 0.002" pos="0.03 0.045 0.01" rgba="0.8 0.1 0.1 1"/> <!-- Indicator -->
            
            <!-- Flashlight Lens (Front side) -->
            <geom type="cylinder" size="0.015 0.002" pos="-0.05 0.04 0" euler="90 0 0" rgba="1 1 1 0.8" material="plastic_mat"/>
        </body>`
    },
    {
        name: 'emergency_blanket',
        category: 'survival',
        triggerKeywords: ['Cold', 'Night-time'],
        rgba: '0.85 0.88 0.80 1',
        xml: (i: number, x: number, y: number) => `
        <body name="emergency_blanket_eq${i}" pos="${x} ${y} 0.01">
            <freejoint/>
            <!-- Folded mylar: ~10cm x 8cm x 1cm -->
            <!-- Base block -->
            <geom name="blanket_packet_eq${i}" type="box" size="0.05 0.04 0.005" rgba="0.8 0.8 0.8 1" mass="0.05" friction="0.8 0.2 0.05" material="tool_metal_mat"/>
            
            <!-- Crinkled texture layers -->
            <geom type="box" size="0.048 0.038 0.001" pos="0.001 0.001 0.006" euler="0 0 1" material="tool_metal_mat"/>
            <geom type="box" size="0.049 0.039 0.001" pos="-0.001 -0.001 0.004" euler="0 0 -1" material="tool_metal_mat"/>
            
            <!-- Label (High-visibility Orange/Green) -->
            <geom type="box" size="0.04 0.03 0.001" pos="0 0 0.007" rgba="1 0.4 0 1" material="medical_label_mat"/>
            <geom type="box" size="0.03 0.002 0.0001" pos="0 0.01 0.0075" rgba="1 1 1 1"/> <!-- "EMERGENCY" -->
            <geom type="box" size="0.025 0.002 0.0001" pos="0 0 0.0075" rgba="1 1 1 1"/> <!-- "BLANKET" -->
            
            <!-- Plastic outer wrap -->
            <geom type="box" size="0.052 0.042 0.008" rgba="1 1 1 0.1" material="plastic_mat"/>
        </body>`
    },
    {
        name: 'emergency_tarp',
        category: 'shelter',
        triggerKeywords: ['Flood', 'Shelter Damage', 'Earthquake'],
        rgba: '0.05 0.20 0.48 1',
        xml: (i: number, x: number, y: number) => `
        <body name="emergency_tarp${i}" pos="${x} ${y} 0.02">
            <freejoint/>
            <!-- Folded tarp: ~20cm x 15cm x 4cm -->
            <!-- Main folded block -->
            <geom name="tarp_fold${i}" type="box" size="0.1 0.075 0.02" rgba="0.1 0.3 0.6 1" mass="0.5" friction="1.1 0.25 0.05" material="plastic_mat"/>
            
            <!-- Layered folds detail -->
            <geom type="box" size="0.098 0.073 0.005" pos="0 0 0.021" rgba="0.15 0.35 0.65 1" material="plastic_mat"/>
            <geom type="box" size="0.098 0.073 0.005" pos="0 0 -0.021" rgba="0.15 0.35 0.65 1" material="plastic_mat"/>
            
            <!-- Grommets (Reinforced metal rings) -->
            <body name="grommet_1_${i}" pos="0.09 0.065 0">
                <geom type="cylinder" size="0.008 0.022" rgba="0.7 0.7 0.7 1" material="tool_metal_mat"/>
                <geom type="cylinder" size="0.004 0.023" rgba="0 0 0 1"/> <!-- Hole -->
            </body>
            <body name="grommet_2_${i}" pos="-0.09 0.065 0">
                <geom type="cylinder" size="0.008 0.022" rgba="0.7 0.7 0.7 1" material="tool_metal_mat"/>
                <geom type="cylinder" size="0.004 0.023" rgba="0 0 0 1"/> <!-- Hole -->
            </body>
            <body name="grommet_3_${i}" pos="0.09 -0.065 0">
                <geom type="cylinder" size="0.008 0.022" rgba="0.7 0.7 0.7 1" material="tool_metal_mat"/>
                <geom type="cylinder" size="0.004 0.023" rgba="0 0 0 1"/> <!-- Hole -->
            </body>
            <body name="grommet_4_${i}" pos="-0.09 -0.065 0">
                <geom type="cylinder" size="0.008 0.022" rgba="0.7 0.7 0.7 1" material="tool_metal_mat"/>
                <geom type="cylinder" size="0.004 0.023" rgba="0 0 0 1"/> <!-- Hole -->
            </body>
            
            <!-- Label (Heavy duty branding) -->
            <geom type="box" size="0.06 0.045 0.001" pos="0 0 0.026" material="food_label_mat"/>
            <geom type="box" size="0.05 0.01 0.0011" pos="0 0.02 0.026" rgba="0.1 0.1 0.1 1"/> <!-- "HEAVY DUTY" -->
            <geom type="box" size="0.04 0.005 0.0011" pos="0 -0.01 0.026" rgba="0.1 0.3 0.8 1"/> <!-- Size info -->
        </body>`
    }
];
