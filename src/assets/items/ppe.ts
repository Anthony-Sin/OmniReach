/**
 * @category    PPE
 * @description Detailed Personal Protective Equipment survival items.
 */

export const ppeItems = [
    {
        name: 'n95_mask',
        category: 'ppe',
        triggerKeywords: ['Disease', 'Outbreak', 'Wildfire', 'Dust'],
        rgba: '0.92 0.90 0.84 1',
        xml: (i: number, x: number, y: number) => `
        <body name="n95_mask${i}" pos="${x} ${y} 0.03">
            <freejoint/>
            <!-- Cup-shaped shell: ~12cm diameter, semi-rigid fabric -->
            <geom name="mask_shell${i}" type="ellipsoid" size="0.06 0.05 0.035" rgba="0.98 0.98 0.95 1" mass="0.015" friction="0.8 0.2 0.05" material="fabric_mat"/>
            
            <!-- Nose clip (Malleable aluminum strip) -->
            <geom type="box" size="0.025 0.003 0.001" pos="0 0.045 0.025" quat="0.98 0.2 0 0" rgba="0.75 0.75 0.8 1" material="tool_metal_mat"/>
            
            <!-- Exhalation Valve (Cool-flow style) -->
            <body name="mask_valve${i}" pos="0 -0.01 0.03">
                <geom type="box" size="0.012 0.012 0.005" rgba="0.9 0.9 0.9 1" material="plastic_mat"/>
                <geom type="box" size="0.01 0.01 0.001" pos="0 0 0.005" rgba="0.2 0.2 0.2 1"/> <!-- Valve opening -->
            </body>
            
            <!-- Elastic Straps (Yellowish latex-free elastic) -->
            <geom type="capsule" size="0.0015 0.07" pos="0 0.02 0.01" quat="0.707 0.707 0 0" rgba="0.9 0.85 0.4 1"/>
            <geom type="capsule" size="0.0015 0.07" pos="0 -0.02 0.01" quat="0.707 0.707 0 0" rgba="0.9 0.85 0.4 1"/>
            
            <!-- Strap Attachment Points (Heat welds) -->
            <geom type="cylinder" size="0.004 0.001" pos="0.055 0.02 0.01" rgba="0.8 0.8 0.8 1"/>
            <geom type="cylinder" size="0.004 0.001" pos="-0.055 0.02 0.01" rgba="0.8 0.8 0.8 1"/>
            <geom type="cylinder" size="0.004 0.001" pos="0.055 -0.02 0.01" rgba="0.8 0.8 0.8 1"/>
            <geom type="cylinder" size="0.004 0.001" pos="-0.055 -0.02 0.01" rgba="0.8 0.8 0.8 1"/>
            
            <!-- NIOSH/N95 Print (High-contrast labeling) -->
            <body name="mask_print${i}" pos="-0.02 -0.03 0.032" quat="0.95 0 0.3 0">
                <geom type="box" size="0.015 0.008 0.0001" rgba="0.1 0.1 0.1 0.8"/>
                <geom type="box" size="0.01 0.001 0.0001" pos="0 0.004 0" rgba="0.2 0.2 0.2 1"/>
            </body>
        </body>`
    },
    {
        name: 'hard_hat',
        category: 'ppe',
        triggerKeywords: ['Debris', 'Earthquake', 'Rescue', 'Construction'],
        rgba: '0.95 0.78 0.04 1',
        xml: (i: number, x: number, y: number) => `
        <body name="hard_hat${i}" pos="${x} ${y} 0.08">
            <freejoint/>
            <!-- High-density Polyethylene (HDPE) shell -->
            <geom name="hardhat_shell${i}" type="ellipsoid" size="0.12 0.14 0.09" rgba="0.95 0.75 0.1 1" mass="0.45" friction="0.8 0.2 0.05" material="plastic_mat"/>
            
            <!-- Front Brim (Peak) -->
            <geom type="box" size="0.09 0.05 0.004" pos="0 0.12 -0.04" quat="0.98 0.2 0 0" rgba="0.95 0.75 0.1 1" material="plastic_mat"/>
            
            <!-- Full Perimeter Rim -->
            <geom type="cylinder" size="0.125 0.005" pos="0 0 -0.045" rgba="0.9 0.7 0.05 1" material="plastic_mat"/>
            
            <!-- Reinforcement Ridges (Structural integrity) -->
            <geom type="box" size="0.012 0.12 0.01" pos="0 0 0.085" rgba="0.98 0.8 0.2 1" material="plastic_mat"/>
            <geom type="box" size="0.01 0.1 0.008" pos="0.04 0 0.075" quat="0.98 0 0.2 0" rgba="0.98 0.8 0.2 1" material="plastic_mat"/>
            <geom type="box" size="0.01 0.1 0.008" pos="-0.04 0 0.075" quat="0.98 0 -0.2 0" rgba="0.98 0.8 0.2 1" material="plastic_mat"/>
            
            <!-- Suspension System (Internal webbing & adjustment) -->
            <body name="hardhat_suspension${i}" pos="0 0 -0.03">
                <geom type="cylinder" size="0.105 0.002" rgba="0.2 0.2 0.2 1"/> <!-- Main band -->
                <geom type="box" size="0.005 0.1 0.001" pos="0 0 0.02" rgba="0.3 0.3 0.3 1"/> <!-- Cross strap -->
                <geom type="box" size="0.1 0.005 0.001" pos="0 0 0.02" rgba="0.3 0.3 0.3 1"/> <!-- Cross strap -->
                <!-- Ratchet adjustment knob -->
                <geom type="cylinder" size="0.015 0.01" pos="0 -0.11 0" quat="0.707 0 0 0.707" rgba="0.1 0.1 0.1 1"/>
            </body>
            
            <!-- Safety Decals & Reflective Strips -->
            <geom type="box" size="0.04 0.001 0.015" pos="0 0.14 0" rgba="0.95 0.95 0.95 1"/> <!-- Front reflective -->
            <geom type="box" size="0.03 0.001 0.01" pos="0.1 0.08 0" quat="0.707 0 0 0.707" rgba="0.9 0.9 0.9 1"/> <!-- Side reflective -->
            <geom type="box" size="0.03 0.001 0.01" pos="-0.1 0.08 0" quat="0.707 0 0 -0.707" rgba="0.9 0.9 0.9 1"/> <!-- Side reflective -->
            
            <!-- Accessory Slots (Earmuff/Face shield mounts) -->
            <geom type="box" size="0.005 0.02 0.01" pos="0.12 0 -0.02" rgba="0.1 0.1 0.1 1"/>
            <geom type="box" size="0.005 0.02 0.01" pos="-0.12 0 -0.02" rgba="0.1 0.1 0.1 1"/>
        </body>`
    }
];
