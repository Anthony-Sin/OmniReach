
/**
 * blankets.ts
 * Definitions for blankets and bedding in the MuJoCo simulation.
 */

export const blanketItems = [
    {
        name: "Emergency Blanket",
        category: "blankets",
        xml: (i: number, x: number, y: number) => `
            <body name="blanket_${i}" pos="${x} ${y} 0.01">
                <joint type="free"/>
                <!-- Folded foil: ~10cm x 8cm x 2cm -->
                <!-- Base block -->
                <geom type="box" size="0.05 0.04 0.008" material="tool_metal_mat" mass="0.1" friction="1.2 0.3 0.1"/>
                
                <!-- Crinkled layers (slightly offset boxes with varied rotations) -->
                <geom type="box" size="0.048 0.038 0.002" pos="0.001 0.001 0.009" euler="0 0 2" material="tool_metal_mat"/>
                <geom type="box" size="0.049 0.039 0.002" pos="-0.001 -0.001 0.007" euler="0 0 -1" material="tool_metal_mat"/>
                <geom type="box" size="0.047 0.037 0.002" pos="0.002 -0.002 0.005" euler="0 0 3" material="tool_metal_mat"/>
                <geom type="box" size="0.046 0.036 0.002" pos="-0.002 0.002 0.003" euler="0 0 -2" material="tool_metal_mat"/>
                
                <!-- Label with text -->
                <geom type="box" size="0.035 0.025 0.001" pos="0 0 0.011" material="medical_label_mat"/>
                <geom type="box" size="0.025 0.002 0.0001" pos="0 0.008 0.0115" rgba="0.1 0.1 0.1 1"/>
                <geom type="box" size="0.02 0.002 0.0001" pos="0 0 0.0115" rgba="0.1 0.1 0.1 1"/>
                <geom type="box" size="0.015 0.002 0.0001" pos="0 -0.008 0.0115" rgba="0.1 0.1 0.1 1"/>
                
                <!-- Plastic wrap sheen (outer shell with slight transparency and reflection) -->
                <geom type="box" size="0.052 0.042 0.012" rgba="1 1 1 0.15" material="plastic_mat"/>
                <!-- Sealed edges -->
                <geom type="box" size="0.053 0.002 0.013" pos="0 0.042 0" rgba="1 1 1 0.2" material="plastic_mat"/>
                <geom type="box" size="0.053 0.002 0.013" pos="0 -0.042 0" rgba="1 1 1 0.2" material="plastic_mat"/>
            </body>`
    },
    {
        name: "Wool Blanket",
        category: "blankets",
        xml: (i: number, x: number, y: number) => `
            <body name="wool_blanket_${i}" pos="${x} ${y} 0.05">
                <joint type="free"/>
                <!-- Rolled wool: ~25cm x 15cm x 10cm -->
                <!-- Main roll (outer layer) -->
                <geom type="cylinder" size="0.05 0.12" rgba="0.4 0.3 0.2 1" mass="1.2" euler="90 0 0" material="fabric_mat"/>
                
                <!-- Inner roll detail (concentric cylinders to show layers at ends) -->
                <geom type="cylinder" size="0.045 0.122" rgba="0.35 0.25 0.15 1" euler="90 0 0" material="fabric_mat"/>
                <geom type="cylinder" size="0.035 0.124" rgba="0.3 0.2 0.1 1" euler="90 0 0" material="fabric_mat"/>
                <geom type="cylinder" size="0.02 0.126" rgba="0.25 0.15 0.05 1" euler="90 0 0" material="fabric_mat"/>
                
                <!-- Label wrap (paper band with slight thickness) -->
                <geom type="cylinder" size="0.051 0.04" pos="0 0 0" euler="90 0 0" material="food_label_mat"/>
                <geom type="box" size="0.03 0.001 0.01" pos="0 0.052 0" rgba="0.1 0.1 0.1 1"/> <!-- Text on label -->
                <geom type="box" size="0.02 0.001 0.005" pos="0 0.052 0.015" rgba="0.8 0.1 0.1 1"/> <!-- Red accent logo -->
                
                <!-- Straps (tightening the roll with visible thickness) -->
                <geom type="cylinder" size="0.052 0.008" pos="0 0.08 0" euler="90 0 0" rgba="0.05 0.05 0.05 1"/>
                <geom type="cylinder" size="0.052 0.008" pos="0 -0.08 0" euler="90 0 0" rgba="0.05 0.05 0.05 1"/>
                
                <!-- Buckles on straps (detailed with metal material) -->
                <body name="buckle_1_${i}" pos="0.05 0.08 0">
                    <geom type="box" size="0.005 0.01 0.012" material="tool_metal_mat"/>
                    <geom type="box" size="0.006 0.002 0.01" pos="0.001 0 0" rgba="0.1 0.1 0.1 1"/> <!-- Buckle slot -->
                </body>
                <body name="buckle_2_${i}" pos="0.05 -0.08 0">
                    <geom type="box" size="0.005 0.01 0.012" material="tool_metal_mat"/>
                    <geom type="box" size="0.006 0.002 0.01" pos="0.001 0 0" rgba="0.1 0.1 0.1 1"/> <!-- Buckle slot -->
                </body>
            </body>`
    }
];
