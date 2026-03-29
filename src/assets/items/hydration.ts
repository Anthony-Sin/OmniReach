/**
 * @category    Hydration
 * @description Detailed water-related survival items.
 */

export const hydrationItems = [
    {
        name: 'water_bottle',
        category: 'hydration',
        triggerKeywords: ['Flood', 'Debris', 'Rescue', 'Earthquake', 'Wildfire'],
        rgba: '0.2 0.6 1 0.4',
        xml: (i: number, x: number, y: number) => `
        <body name="water_bottle${i}" pos="${x} ${y} 0.1">
            <freejoint/>
            <!-- Main PET body: ~6.5cm diameter, ~20cm height -->
            <geom name="bottle_body${i}" type="cylinder" size="0.0325 0.08" rgba="0.22 0.62 0.98 0.2" mass="0.5" friction="1.5 0.3 0.1" material="plastic_mat" solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
            
            <!-- Water level (Inner cylinder) -->
            <geom type="cylinder" size="0.031 0.06" pos="0 0 -0.015" rgba="0.3 0.7 1.0 0.4" material="plastic_mat"/>
            
            <!-- Structural base (Reinforced bottom) -->
            <geom type="cylinder" size="0.033 0.008" pos="0 0 -0.075" rgba="0.18 0.55 0.90 0.6" material="plastic_mat"/>
            
            <!-- Ribs for grip and realism -->
            <geom type="cylinder" size="0.034 0.001" pos="0 0 0.04" rgba="0.18 0.55 0.90 0.3"/>
            <geom type="cylinder" size="0.034 0.001" pos="0 0 0.02" rgba="0.18 0.55 0.90 0.3"/>
            <geom type="cylinder" size="0.034 0.001" pos="0 0 0.00" rgba="0.18 0.55 0.90 0.3"/>
            <geom type="cylinder" size="0.034 0.001" pos="0 0 -0.02" rgba="0.18 0.55 0.90 0.3"/>
            <geom type="cylinder" size="0.034 0.001" pos="0 0 -0.04" rgba="0.18 0.55 0.90 0.3"/>
            
            <!-- Label: High-contrast blue/white with material -->
            <geom name="bottle_label${i}" type="cylinder" size="0.0335 0.03" pos="0 0 0.01" material="water_label_mat"/>
            
            <!-- Neck and Shoulder -->
            <geom name="bottle_shoulder${i}" type="cylinder" size="0.030 0.015" pos="0 0 0.085" rgba="0.22 0.62 0.98 0.3" material="plastic_mat"/>
            <geom name="bottle_neck${i}" type="cylinder" size="0.015 0.015" pos="0 0 0.105" rgba="0.22 0.62 0.98 0.4" material="plastic_mat"/>
            
            <!-- Cap (Detailed with ribs) -->
            <body name="bottle_cap_body${i}" pos="0 0 0.12">
                <geom name="bottle_cap${i}" type="cylinder" size="0.017 0.01" rgba="0.08 0.30 0.78 1" material="plastic_mat"/>
                <!-- Cap ribs -->
                <geom type="box" size="0.001 0.017 0.01" pos="0.017 0 0" rgba="0.05 0.25 0.7 1"/>
                <geom type="box" size="0.001 0.017 0.01" pos="-0.017 0 0" rgba="0.05 0.25 0.7 1"/>
                <geom type="box" size="0.017 0.001 0.01" pos="0 0.017 0" rgba="0.05 0.25 0.7 1"/>
                <geom type="box" size="0.017 0.001 0.01" pos="0 -0.017 0" rgba="0.05 0.25 0.7 1"/>
            </body>
            
            <!-- Brand Logo & Details on Label -->
            <geom type="box" size="0.005 0.008 0.008" pos="0.0336 0 0.02" rgba="0.1 0.4 0.9 1"/> <!-- Logo -->
            <geom type="box" size="0.001 0.015 0.002" pos="0.0337 0 0.005" rgba="0.2 0.2 0.2 1"/> <!-- Text line -->
            <geom type="box" size="0.001 0.012 0.001" pos="0.0337 0 -0.005" rgba="0.4 0.4 0.4 1"/> <!-- Subtext -->
        </body>`
    },
    {
        name: 'water_filter',
        category: 'survival',
        triggerKeywords: ['Flood'],
        rgba: '0.10 0.45 0.75 1',
        xml: (i: number, x: number, y: number) => `
        <body name="water_filter${i}" pos="${x} ${y} 0.1">
            <freejoint/>
            <!-- Filter housing: ~3cm diameter, ~20cm height -->
            <geom name="filter_body${i}" type="cylinder" size="0.015 0.09" rgba="0.10 0.42 0.78 1" mass="0.15" friction="1.6 0.3 0.1" material="plastic_mat" solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
            
            <!-- Ribbed grip (Rubberized feel) -->
            <geom type="cylinder" size="0.0165 0.005" pos="0 0 0.04" rgba="0.05 0.15 0.4 1" material="plastic_mat"/>
            <geom type="cylinder" size="0.0165 0.005" pos="0 0 0.01" rgba="0.05 0.15 0.4 1" material="plastic_mat"/>
            <geom type="cylinder" size="0.0165 0.005" pos="0 0 -0.02" rgba="0.05 0.15 0.4 1" material="plastic_mat"/>
            <geom type="cylinder" size="0.0165 0.005" pos="0 0 -0.05" rgba="0.05 0.15 0.4 1" material="plastic_mat"/>
            
            <!-- Label with material -->
            <geom name="filter_label${i}" type="cylinder" size="0.0155 0.04" pos="0 0 0.01" material="water_label_mat"/>
            
            <!-- Inlet (Bottom) -->
            <body name="filter_inlet_body${i}" pos="0 0 -0.1">
                <geom name="filter_inlet${i}" type="cylinder" size="0.012 0.01" material="tool_metal_mat"/>
                <geom type="cylinder" size="0.008 0.012" pos="0 0 -0.005" rgba="0.2 0.2 0.2 1"/> <!-- Port -->
            </body>
            
            <!-- Outlet & Bite Valve (Top) -->
            <body name="filter_outlet_body${i}" pos="0 0 0.105">
                <geom name="filter_outlet_neck${i}" type="cylinder" size="0.01 0.015" rgba="0.9 0.9 0.9 1" material="plastic_mat"/>
                <geom name="filter_bite_valve${i}" type="cylinder" size="0.011 0.008" pos="0 0 0.015" rgba="0.95 0.95 0.95 1" material="plastic_mat"/>
                <!-- Cap for bite valve -->
                <geom type="cylinder" size="0.012 0.002" pos="0 0 0.023" rgba="0.1 0.4 0.8 1"/>
            </body>
            
            <!-- Lanyard attachment point -->
            <geom type="box" size="0.005 0.008 0.002" pos="0 0.015 0.08" rgba="0.05 0.15 0.4 1"/>
            
            <!-- Branding & Instructions -->
            <geom type="box" size="0.001 0.01 0.015" pos="0.0156 0 0.01" rgba="1 1 1 1"/> <!-- White block -->
            <geom type="box" size="0.001 0.008 0.002" pos="0.0157 0 0.02" rgba="0 0 0 1"/> <!-- Title line -->
            <geom type="box" size="0.001 0.006 0.001" pos="0.0157 0 0.01" rgba="0.2 0.2 0.2 1"/> <!-- Detail line -->
        </body>`
    }
];
