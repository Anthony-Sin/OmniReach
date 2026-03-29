/**
 * @category    Tools
 * @description Detailed infrastructure, lighting, and navigation survival items.
 */

export const toolsItems = [
    {
        name: 'multitool',
        category: 'infrastructure',
        triggerKeywords: ['Debris', 'Rescue', 'Repair'],
        rgba: '0.25 0.25 0.28 1',
        xml: (i: number, x: number, y: number) => `
        <body name="multitool${i}" pos="${x} ${y} 0.015">
            <freejoint/>
            <!-- Main chassis: ~10cm x 4cm x 2cm, brushed stainless steel -->
            <geom name="multitool_frame${i}" type="box" size="0.05 0.018 0.012" rgba="0.5 0.5 0.55 1" material="tool_metal_mat" mass="0.24" friction="1.8 0.4 0.1" solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
            
            <!-- Handle Scales (Textured G10/Plastic) -->
            <geom type="box" size="0.048 0.016 0.002" pos="0 0 0.012" rgba="0.12 0.12 0.12 1" material="plastic_mat"/>
            <geom type="box" size="0.048 0.016 0.002" pos="0 0 -0.012" rgba="0.12 0.12 0.12 1" material="plastic_mat"/>
            
            <!-- Grip texture details -->
            <geom type="box" size="0.002 0.014 0.001" pos="0.03 0 0.013" rgba="0.2 0.2 0.2 1"/>
            <geom type="box" size="0.002 0.014 0.001" pos="0.01 0 0.013" rgba="0.2 0.2 0.2 1"/>
            <geom type="box" size="0.002 0.014 0.001" pos="-0.01 0 0.013" rgba="0.2 0.2 0.2 1"/>
            <geom type="box" size="0.002 0.014 0.001" pos="-0.03 0 0.013" rgba="0.2 0.2 0.2 1"/>
            
            <!-- Pivot Points & Rivets (Detailed metal) -->
            <geom type="cylinder" size="0.005 0.013" pos="0.042 0.01 0" rgba="0.5 0.5 0.5 1" material="tool_metal_mat"/>
            <geom type="cylinder" size="0.005 0.013" pos="0.042 -0.01 0" rgba="0.5 0.5 0.5 1" material="tool_metal_mat"/>
            <geom type="cylinder" size="0.005 0.013" pos="-0.042 0.01 0" rgba="0.5 0.5 0.5 1" material="tool_metal_mat"/>
            <geom type="cylinder" size="0.005 0.013" pos="-0.042 -0.01 0" rgba="0.5 0.5 0.5 1" material="tool_metal_mat"/>
            
            <!-- Tool tips (Slightly protruding) -->
            <geom type="box" size="0.008 0.004 0.008" pos="0.045 0.01 0" rgba="0.6 0.6 0.6 1" material="tool_metal_mat"/> <!-- Pliers head -->
            <geom type="box" size="0.01 0.002 0.006" pos="-0.045 -0.01 0" rgba="0.6 0.6 0.6 1" material="tool_metal_mat"/> <!-- Blade tip -->
            
            <!-- Pocket Clip (Spring steel) -->
            <geom type="box" size="0.03 0.004 0.001" pos="0.01 0.012 0.014" rgba="0.4 0.4 0.4 1" material="tool_metal_mat"/>
            <geom type="box" size="0.005 0.004 0.004" pos="0.035 0.012 0.012" rgba="0.4 0.4 0.4 1"/>
            
            <!-- Lanyard Hole -->
            <geom type="cylinder" size="0.003 0.015" pos="-0.045 0 0" quat="0.707 0 0.707 0" rgba="0.1 0.1 0.1 1"/>
            
            <!-- Brand Label & Logo (High-contrast) -->
            <body name="multitool_logo_${i}" pos="0 0 0.014">
                <geom type="box" size="0.012 0.005 0.0005" rgba="0.9 0.9 0.9 1"/> <!-- Label background -->
                <geom type="box" size="0.008 0.002 0.0001" pos="0 0 0.0006" rgba="0.8 0.1 0.1 1"/> <!-- Red logo block -->
                <geom type="box" size="0.006 0.001 0.0001" pos="0 -0.002 0.0006" rgba="0 0 0 1"/> <!-- Text line -->
            </body>
        </body>`
    },
    {
        name: 'flashlight',
        category: 'tools_lighting',
        triggerKeywords: ['Debris', 'Rescue', 'Earthquake', 'Darkness'],
        rgba: '0.12 0.12 0.14 1',
        xml: (i: number, x: number, y: number) => `
        <body name="flashlight${i}" pos="${x} ${y} 0.02">
            <freejoint/>
            <!-- Main Body: ~3cm diameter, ~12cm height, anodized aluminum -->
            <geom name="flashlight_body${i}" type="cylinder" size="0.014 0.05" rgba="0.05 0.05 0.05 1" material="tool_metal_mat" mass="0.18" friction="1.8 0.4 0.1" solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
            
            <!-- Cooling Fins on Head -->
            <geom type="cylinder" size="0.016 0.001" pos="0 0 0.04" rgba="0.02 0.02 0.02 1"/>
            <geom type="cylinder" size="0.016 0.001" pos="0 0 0.035" rgba="0.02 0.02 0.02 1"/>
            <geom type="cylinder" size="0.016 0.001" pos="0 0 0.03" rgba="0.02 0.02 0.02 1"/>
            
            <!-- Head / Bezel (Tapered) -->
            <geom type="cylinder" size="0.022 0.015" pos="0 0 0.06" rgba="0.08 0.08 0.1 1" material="tool_metal_mat"/>
            <geom type="cylinder" size="0.024 0.004" pos="0 0 0.075" rgba="0.02 0.02 0.02 1"/> <!-- Crenellated edge -->
            
            <!-- Lens & LED (Multi-layered) -->
            <geom type="cylinder" size="0.02 0.002" pos="0 0 0.076" rgba="0.9 0.9 1.0 0.4"/> <!-- Glass -->
            <geom type="cylinder" size="0.005 0.002" pos="0 0 0.07" rgba="1 1 0.8 1"/> <!-- LED Emitter -->
            <geom type="cylinder" size="0.018 0.01" pos="0 0 0.065" rgba="0.8 0.8 0.8 1"/> <!-- Reflector cone -->
            
            <!-- Tail Cap (Textured) -->
            <geom type="cylinder" size="0.016 0.01" pos="0 0 -0.06" rgba="0.15 0.15 0.18 1" material="tool_metal_mat"/>
            <geom type="cylinder" size="0.008 0.002" pos="0 0 -0.07" rgba="0.8 0.1 0.1 1"/> <!-- Tail switch -->
            
            <!-- Knurling Pattern (Simulated diamond grip) -->
            <geom type="cylinder" size="0.0145 0.001" pos="0 0 0.02" rgba="0.05 0.05 0.05 1"/>
            <geom type="cylinder" size="0.0145 0.001" pos="0 0 0.01" rgba="0.05 0.05 0.05 1"/>
            <geom type="cylinder" size="0.0145 0.001" pos="0 0 0.00" rgba="0.05 0.05 0.05 1"/>
            <geom type="cylinder" size="0.0145 0.001" pos="0 0 -0.01" rgba="0.05 0.05 0.05 1"/>
            <geom type="cylinder" size="0.0145 0.001" pos="0 0 -0.02" rgba="0.05 0.05 0.05 1"/>
            
            <!-- Side Switch (Rubberized) -->
            <geom type="box" size="0.005 0.005 0.003" pos="0 0.014 0.04" rgba="0.1 0.1 0.1 1" material="plastic_mat"/>
            
            <!-- Pocket Clip (Spring steel) -->
            <geom type="box" size="0.002 0.005 0.04" pos="0 0.016 -0.01" rgba="0.4 0.4 0.4 1" material="tool_metal_mat"/>
            
            <!-- Branding Label -->
            <geom type="cylinder" size="0.0142 0.008" pos="0 0 -0.04" material="water_label_mat"/>
        </body>`
    },
    {
        name: 'compass',
        category: 'navigation',
        triggerKeywords: ['Displacement', 'Rescue', 'Debris', 'Navigation'],
        rgba: '0.35 0.32 0.20 1',
        xml: (i: number, x: number, y: number) => `
        <body name="compass${i}" pos="${x} ${y} 0.015">
            <freejoint/>
            <!-- Housing: ~6cm x 6cm x 2cm, olive drab metal -->
            <geom name="compass_body${i}" type="box" size="0.03 0.03 0.012" rgba="0.22 0.28 0.15 1" material="tool_metal_mat" mass="0.13" friction="1.4 0.3 0.1" solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
            
            <!-- Dial Face (Detailed markings) -->
            <geom type="cylinder" size="0.026 0.001" pos="0 0 0.013" rgba="0.98 0.98 0.95 1" material="plastic_mat"/>
            <body name="compass_dial_${i}" pos="0 0 0.014">
                <geom type="box" size="0.022 0.002 0.001" rgba="0.8 0.1 0.1 1"/> <!-- Needle North -->
                <geom type="box" size="0.022 0.002 0.001" quat="0 0 0 1" rgba="0.1 0.1 0.1 1"/> <!-- Needle South -->
                <geom type="cylinder" size="0.003 0.002" rgba="0.4 0.4 0.4 1"/> <!-- Center pivot -->
            </body>
            
            <!-- Cardinal Markers (N, S, E, W) -->
            <geom type="box" size="0.001 0.006 0.001" pos="0 0.022 0.014" rgba="0 0 0 1"/> <!-- N -->
            <geom type="box" size="0.001 0.006 0.001" pos="0 -0.022 0.014" rgba="0 0 0 1"/> <!-- S -->
            <geom type="box" size="0.006 0.001 0.001" pos="0.022 0 0.014" rgba="0 0 0 1"/> <!-- E -->
            <geom type="box" size="0.006 0.001 0.001" pos="-0.022 0 0.014" rgba="0 0 0 1"/> <!-- W -->
            
            <!-- Glass Cover (Transparent layer) -->
            <geom type="cylinder" size="0.027 0.002" pos="0 0 0.015" rgba="0.9 0.9 1 0.25"/>
            
            <!-- Hinge & Lid Detail (Simulated) -->
            <geom type="cylinder" size="0.004 0.03" pos="0 0.032 0" quat="0.707 0 0 0.707" rgba="0.25 0.22 0.15 1" material="tool_metal_mat"/>
            <geom type="box" size="0.01 0.005 0.002" pos="0 0.035 0.01" rgba="0.3 0.28 0.18 1"/>
            
            <!-- Sighting Wire (On lid) -->
            <geom type="box" size="0.0005 0.025 0.001" pos="0 0.06 0.01" rgba="0.1 0.1 0.1 1"/>
        </body>`
    },
    {
        name: 'walkie_talkie',
        category: 'navigation',
        triggerKeywords: ['Communications Blackout', 'Rescue', 'Debris', 'Radio'],
        rgba: '0.10 0.10 0.12 1',
        xml: (i: number, x: number, y: number) => `
        <body name="walkie_talkie${i}" pos="${x} ${y} 0.08">
            <freejoint/>
            <!-- Ergonomic Body: ~5cm x 2.5cm x 12cm, ruggedized plastic -->
            <geom name="walkie_body${i}" type="box" size="0.025 0.012 0.06" rgba="0.15 0.35 0.15 1" mass="0.32" friction="1.5 0.3 0.1" material="plastic_mat" solref="0.01 1" solimp="0.95 0.99 0.001 0.5 2" condim="4"/>
            <geom type="box" size="0.023 0.014 0.055" pos="0 0 0" rgba="0.1 0.1 0.1 1" material="plastic_mat"/> <!-- Side grips -->
            
            <!-- Antenna (Flexible base, textured tip) -->
            <geom type="cylinder" size="0.004 0.01" pos="0.015 0 0.065" rgba="0.1 0.1 0.1 1"/> <!-- Base -->
            <geom type="cylinder" size="0.002 0.05" pos="0.015 0 0.1" rgba="0.05 0.05 0.08 1"/> <!-- Whip -->
            
            <!-- Control Knobs (Knurled) -->
            <body name="walkie_knobs_${i}" pos="0 0 0.065">
                <geom type="cylinder" size="0.007 0.008" pos="-0.01 0 0" rgba="0.15 0.15 0.15 1"/> <!-- Volume -->
                <geom type="cylinder" size="0.006 0.008" pos="0.005 0 0" rgba="0.15 0.15 0.15 1"/> <!-- Channel -->
                <geom type="box" size="0.001 0.003 0.003" pos="-0.01 0.008 0" rgba="1 1 1 1"/> <!-- Indicator mark -->
            </body>
            
            <!-- Speaker Grille (Mesh pattern) -->
            <body name="walkie_speaker_${i}" pos="0 0.013 -0.015">
                <geom type="box" size="0.02 0.001 0.02" rgba="0.05 0.05 0.05 1"/>
                <geom type="box" size="0.018 0.0012 0.001" pos="0 0 0.012" rgba="0.1 0.1 0.1 1"/>
                <geom type="box" size="0.018 0.0012 0.001" pos="0 0 0.004" rgba="0.1 0.1 0.1 1"/>
                <geom type="box" size="0.018 0.0012 0.001" pos="0 0 -0.004" rgba="0.1 0.1 0.1 1"/>
                <geom type="box" size="0.018 0.0012 0.001" pos="0 0 -0.012" rgba="0.1 0.1 0.1 1"/>
            </body>
            
            <!-- LCD Display (Multi-layered with backlight) -->
            <body name="walkie_display_${i}" pos="0 0.013 0.025">
                <geom type="box" size="0.018 0.001 0.012" rgba="0.1 0.1 0.1 1"/> <!-- Border -->
                <geom type="box" size="0.016 0.0012 0.01" pos="0 0.0005 0" rgba="0.3 0.8 0.3 0.8"/> <!-- Backlight -->
                <!-- Simulated Segments -->
                <geom type="box" size="0.012 0.0014 0.002" pos="0 0.001 0.004" rgba="0 0 0 1"/>
                <geom type="box" size="0.008 0.0014 0.002" pos="-0.004 0.001 -0.004" rgba="0 0 0 1"/>
            </body>
            
            <!-- PTT Button (Textured) -->
            <geom type="box" size="0.002 0.01 0.02" pos="-0.027 0 0.025" rgba="0.2 0.2 0.2 1" material="plastic_mat"/>
            <geom type="box" size="0.0025 0.006 0.012" pos="-0.027 0 0.025" rgba="0.1 0.1 0.1 1"/>
            
            <!-- Belt Clip (Spring steel) -->
            <geom type="box" size="0.012 0.005 0.04" pos="0 -0.015 0" rgba="0.3 0.3 0.3 1" material="tool_metal_mat"/>
        </body>`
    }
];
