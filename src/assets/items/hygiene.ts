
/**
 * hygiene.ts
 * Definitions for hygiene supplies in the MuJoCo simulation.
 */

export const hygieneItems = [
    {
        name: "Soap Pack",
        category: "hygiene",
        xml: (i: number, x: number, y: number) => `
            <body name="soap_${i}" pos="${x} ${y} 0.01">
                <joint type="free"/>
                <!-- Soap bar: ~8cm x 5cm x 2cm with rounded edges -->
                <geom type="box" size="0.038 0.023 0.009" rgba="0.85 0.95 0.85 1" mass="0.1" friction="1.5 0.3 0.1"/>
                <!-- Rounded edge details -->
                <geom type="cylinder" size="0.009 0.038" pos="0 0.023 0" euler="0 90 0" rgba="0.85 0.95 0.85 1"/>
                <geom type="cylinder" size="0.009 0.038" pos="0 -0.023 0" euler="0 90 0" rgba="0.85 0.95 0.85 1"/>
                <geom type="cylinder" size="0.009 0.023" pos="0.038 0 0" euler="90 0 0" rgba="0.85 0.95 0.85 1"/>
                <geom type="cylinder" size="0.009 0.023" pos="-0.038 0 0" euler="90 0 0" rgba="0.85 0.95 0.85 1"/>
                
                <!-- Paper wrapper with slight sheen -->
                <geom type="box" size="0.041 0.026 0.011" rgba="0.2 0.7 0.4 0.4" material="plastic_mat"/>
                <!-- Wrapper fold details -->
                <geom type="box" size="0.005 0.026 0.011" pos="0.036 0 0" rgba="0.1 0.5 0.3 0.6"/>
                <geom type="box" size="0.005 0.026 0.011" pos="-0.036 0 0" rgba="0.1 0.5 0.3 0.6"/>
                
                <!-- Brand Label -->
                <geom type="box" size="0.03 0.02 0.001" pos="0 0 0.0115" material="water_label_mat"/>
                <geom type="box" size="0.015 0.008 0.0001" pos="0 0.005 0.012" rgba="0.1 0.1 0.8 1"/> <!-- Logo block -->
                <geom type="box" size="0.02 0.002 0.0001" pos="0 -0.005 0.012" rgba="0.3 0.3 0.3 1"/> <!-- Text line -->
                <geom type="box" size="0.01 0.001 0.0001" pos="0 -0.008 0.012" rgba="0.5 0.5 0.5 1"/> <!-- Subtext -->
            </body>`
    },
    {
        name: "Toothpaste Tube",
        category: "hygiene",
        xml: (i: number, x: number, y: number) => `
            <body name="toothpaste_${i}" pos="${x} ${y} 0.015">
                <joint type="free"/>
                <!-- Tube body: ~15cm long, tapered -->
                <geom type="cylinder" size="0.012 0.05" pos="0 0 0" euler="0 90 0" rgba="0.1 0.4 0.8 1" mass="0.1" material="plastic_mat"/>
                <!-- Tapered end -->
                <geom type="box" size="0.02 0.012 0.002" pos="-0.06 0 0" euler="0 0 0" rgba="0.05 0.3 0.6 1"/>
                <geom type="box" size="0.005 0.012 0.003" pos="-0.075 0 0" rgba="0.4 0.4 0.4 1"/> <!-- Crimped seal -->
                
                <!-- Cap -->
                <geom type="cylinder" size="0.008 0.01" pos="0.055 0 0" euler="0 90 0" rgba="0.9 0.9 0.9 1" material="plastic_mat"/>
                <geom type="cylinder" size="0.009 0.002" pos="0.065 0 0" euler="0 90 0" rgba="0.8 0.8 0.8 1"/> <!-- Cap rim -->
                
                <!-- Labeling -->
                <geom type="box" size="0.04 0.012 0.001" pos="0 0 0.0122" rgba="1 1 1 1" material="medical_label_mat"/>
                <geom type="box" size="0.03 0.004 0.0001" pos="0 0.004 0.0123" rgba="0.9 0.1 0.1 1"/> <!-- Brand -->
                <geom type="box" size="0.025 0.002 0.0001" pos="0 -0.004 0.0123" rgba="0.1 0.1 0.1 1"/> <!-- "Fluoride" -->
            </body>`
    },
    {
        name: "Toothbrush Kit",
        category: "hygiene",
        xml: (i: number, x: number, y: number) => `
            <body name="toothbrush_${i}" pos="${x} ${y} 0.005">
                <joint type="free"/>
                <!-- Ergonomic Handle: ~18cm long with segments -->
                <geom type="box" size="0.04 0.005 0.003" pos="-0.045 0 0" rgba="0.1 0.6 0.9 1" mass="0.02" material="plastic_mat"/>
                <geom type="box" size="0.03 0.004 0.003" pos="0.02 0 0.001" euler="0 5 0" rgba="0.1 0.6 0.9 1" material="plastic_mat"/>
                <geom type="box" size="0.02 0.003 0.003" pos="0.065 0 0.003" euler="0 10 0" rgba="0.1 0.6 0.9 1" material="plastic_mat"/>
                
                <!-- Rubberized grip detail -->
                <geom type="box" size="0.015 0.0055 0.0035" pos="-0.04 0 0" rgba="0.05 0.3 0.5 1"/>
                
                <!-- Head and bristles -->
                <body name="brush_head_${i}" pos="0.085 0 0.005">
                    <geom type="box" size="0.012 0.006 0.004" rgba="0.1 0.6 0.9 1" material="plastic_mat"/>
                    <!-- Bristle blocks for realism -->
                    <geom type="box" size="0.003 0.004 0.006" pos="-0.006 0 0.004" rgba="1 1 1 0.9"/>
                    <geom type="box" size="0.003 0.004 0.006" pos="0 0 0.004" rgba="0.2 0.7 1 0.9"/>
                    <geom type="box" size="0.003 0.004 0.006" pos="0.006 0 0.004" rgba="1 1 1 0.9"/>
                </body>
                
                <!-- Travel case (Transparent with hinge detail) -->
                <geom type="box" size="0.1 0.012 0.012" rgba="1 1 1 0.15" material="plastic_mat"/>
                <geom type="cylinder" size="0.002 0.012" pos="-0.098 0 0" euler="90 0 0" rgba="0.8 0.8 0.8 0.5"/> <!-- Hinge -->
                <geom type="box" size="0.005 0.008 0.002" pos="0.095 0 0.01" rgba="0.8 0.8 0.8 0.5"/> <!-- Latch -->
            </body>`
    },
    {
        name: "Sanitizer Bottle",
        category: "hygiene",
        xml: (i: number, x: number, y: number) => `
            <body name="sanitizer_${i}" pos="${x} ${y} 0.04">
                <joint type="free"/>
                <!-- Bottle: ~4cm diameter, ~10cm height -->
                <geom name="san_bottle_body${i}" type="cylinder" size="0.022 0.05" rgba="0.6 0.8 1.0 0.4" mass="0.15" material="plastic_mat"/>
                
                <!-- Liquid level (Inner cylinder) -->
                <geom type="cylinder" size="0.02 0.035" pos="0 0 -0.01" rgba="0.4 0.7 1.0 0.6" material="plastic_mat"/>
                
                <!-- Label (Detailed with medical cross) -->
                <geom type="cylinder" size="0.0225 0.03" pos="0 0 -0.01" material="medical_label_mat"/>
                <geom type="box" size="0.005 0.005 0.001" pos="0.0226 0 0.005" rgba="0.8 0.1 0.1 1"/> <!-- Red Cross -->
                <geom type="box" size="0.001 0.005 0.005" pos="0.0226 0 0.005" rgba="0.8 0.1 0.1 1"/> <!-- Cross vertical -->
                <geom type="box" size="0.001 0.012 0.002" pos="0.0227 0 -0.01" rgba="0.1 0.1 0.6 1"/> <!-- Brand text -->
                <geom type="box" size="0.001 0.01 0.001" pos="0.0227 0 -0.015" rgba="0.3 0.3 0.3 1"/> <!-- Subtext -->
                
                <!-- Pump mechanism -->
                <body name="san_pump_${i}" pos="0 0 0.05">
                    <geom type="cylinder" size="0.015 0.005" pos="0 0 0" rgba="0.95 0.95 0.95 1" material="plastic_mat"/> <!-- Cap -->
                    <geom type="cylinder" size="0.004 0.015" pos="0 0 0.015" rgba="0.9 0.9 0.9 1"/> <!-- Stem -->
                    <!-- Pump head -->
                    <body name="san_head_${i}" pos="0 0 0.03">
                        <geom type="cylinder" size="0.01 0.008" rgba="0.95 0.95 0.95 1" material="plastic_mat"/>
                        <geom type="box" size="0.018 0.006 0.006" pos="0.01 0 0.002" rgba="0.95 0.95 0.95 1" material="plastic_mat"/> <!-- Nozzle -->
                        <geom type="cylinder" size="0.002 0.006" pos="0.026 0 0.002" euler="0 90 0" rgba="0.2 0.2 0.2 1"/> <!-- Hole -->
                    </body>
                </body>
            </body>`
    }
];
