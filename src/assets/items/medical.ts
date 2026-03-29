/**
 * @category    Medical
 * @description Detailed medical and first-aid survival items.
 */

export const medicalItems = [
    {
        name: 'epipen',
        category: 'medical_advanced',
        triggerKeywords: ['Allergy', 'Anaphylaxis', 'Emergency'],
        rgba: '0.95 0.95 0.95 1',
        xml: (i: number, x: number, y: number) => `
        <body name="epipen${i}" pos="${x} ${y} 0.015" euler="0 90 0">
            <freejoint/>
            <!-- Main Body: White plastic housing -->
            <geom name="epipen_body${i}" type="cylinder" size="0.01 0.06" rgba="0.98 0.98 0.98 1" mass="0.045" friction="1.0 0.3 0.1" material="plastic_mat"/>
            
            <!-- Blue Safety Cap (Top) -->
            <body name="epipen_cap_top${i}" pos="0 0 0.065">
                <geom type="cylinder" size="0.011 0.01" rgba="0.1 0.3 0.8 1" material="plastic_mat"/>
                <geom type="cylinder" size="0.008 0.005" pos="0 0 0.01" rgba="0.1 0.3 0.8 1"/>
                <!-- Grip ridges -->
                <geom type="box" size="0.012 0.002 0.008" rgba="0.05 0.2 0.6 1"/>
                <geom type="box" size="0.002 0.012 0.008" rgba="0.05 0.2 0.6 1"/>
            </body>
            
            <!-- Orange Activation Tip (Bottom) -->
            <body name="epipen_tip_bottom${i}" pos="0 0 -0.065">
                <geom type="cylinder" size="0.011 0.01" rgba="1 0.5 0 1" material="plastic_mat"/>
                <geom type="cylinder" size="0.006 0.005" pos="0 0 -0.01" rgba="1 0.5 0 1"/>
            </body>
            
            <!-- Pocket Clip (Metallic) -->
            <geom type="box" size="0.002 0.006 0.035" pos="0.011 0 0.02" rgba="0.7 0.7 0.7 1" material="tool_metal_mat"/>
            
            <!-- Main Label (Yellow background) -->
            <geom type="cylinder" size="0.0102 0.04" pos="0 0 0" rgba="1 0.9 0.2 1" material="medical_label_mat"/>
            
            <!-- Medication Inspection Window -->
            <geom type="box" size="0.001 0.005 0.015" pos="0.0103 0 -0.01" rgba="0.7 0.85 1 0.5" material="plastic_mat"/>
            
            <!-- Branding & Instructions -->
            <geom type="box" size="0.001 0.008 0.003" pos="0.0104 0 0.025" rgba="0.1 0.1 0.1 1"/> <!-- "EPIPEN" -->
            <geom type="box" size="0.001 0.007 0.001" pos="0.0104 0 0.018" rgba="0.8 0.1 0.1 1"/> <!-- "0.3mg" -->
            <geom type="box" size="0.001 0.007 0.001" pos="0.0104 0 -0.03" rgba="0.2 0.2 0.2 1"/> <!-- Instructions -->
            <geom type="box" size="0.001 0.007 0.001" pos="0.0104 0 -0.035" rgba="0.2 0.2 0.2 1"/>
        </body>`
    },
    {
        name: 'wound_dressing',
        category: 'medical_advanced',
        triggerKeywords: ['Trauma', 'Bleeding', 'First Aid'],
        rgba: '0.2 0.3 0.2 1',
        xml: (i: number, x: number, y: number) => `
        <body name="wound_dressing${i}" pos="${x} ${y} 0.01">
            <freejoint/>
            <!-- Vacuum-sealed Pouch: Olive Drab/Tactical Green -->
            <geom name="dressing_pouch${i}" type="box" size="0.05 0.075 0.01" rgba="0.25 0.32 0.22 1" mass="0.075" friction="1.0 0.3 0.1" material="plastic_mat"/>
            
            <!-- Bulge from compressed bandage -->
            <geom type="box" size="0.04 0.06 0.015" pos="0 0 0" rgba="0.22 0.28 0.18 1" material="plastic_mat"/>
            <geom type="box" size="0.03 0.04 0.018" pos="0.002 -0.002 0" rgba="0.20 0.25 0.15 1" material="plastic_mat"/>
            
            <!-- Heat-sealed edges (Textured) -->
            <geom type="box" size="0.052 0.008 0.012" pos="0 0.075 0" rgba="0.18 0.22 0.15 1" material="plastic_mat"/>
            <geom type="box" size="0.052 0.008 0.012" pos="0 -0.075 0" rgba="0.18 0.22 0.15 1" material="plastic_mat"/>
            
            <!-- Tear Notches -->
            <geom type="box" size="0.006 0.002 0.014" pos="0.046 0.075 0" rgba="0.1 0.1 0.1 1"/>
            <geom type="box" size="0.006 0.002 0.014" pos="-0.046 -0.075 0" rgba="0.1 0.1 0.1 1"/>
            
            <!-- Tactical Label (Matte White/Gray) -->
            <geom type="box" size="0.04 0.001 0.055" pos="0 0.076 0" rgba="0.9 0.9 0.9 1" material="medical_label_mat"/>
            
            <!-- Red Cross Symbol -->
            <body name="dressing_cross_${i}" pos="0 0.077 0.04">
                <geom type="box" size="0.01 0.001 0.0025" rgba="0.8 0 0 1"/>
                <geom type="box" size="0.0025 0.001 0.01" rgba="0.8 0 0 1"/>
            </body>
            
            <!-- Product Info -->
            <geom type="box" size="0.035 0.0012 0.004" pos="0 0.077 0.02" rgba="0.1 0.1 0.1 1"/> <!-- "TRAUMA BANDAGE" -->
            <geom type="box" size="0.03 0.0012 0.0015" pos="0 0.077 0.01" rgba="0.3 0.3 0.3 1"/> <!-- "Sterile / 4 inch" -->
            
            <!-- Instructions Diagram (Simulated) -->
            <body name="dressing_diag_${i}" pos="0 0.077 -0.03">
                <geom type="box" size="0.02 0.001 0.02" rgba="0.95 0.95 0.95 1"/>
                <geom type="box" size="0.015 0.0012 0.001" pos="0 0 0.01" rgba="0.4 0.4 0.4 1"/>
                <geom type="box" size="0.015 0.0012 0.001" pos="0 0 0" rgba="0.4 0.4 0.4 1"/>
                <geom type="box" size="0.015 0.0012 0.001" pos="0 0 -0.01" rgba="0.4 0.4 0.4 1"/>
            </body>
        </body>`
    },
    {
        name: 'antibiotic_box',
        category: 'medical',
        triggerKeywords: ['Infection', 'Medicine', 'Pharmacy'],
        rgba: '1 1 1 1',
        xml: (i: number, x: number, y: number) => `
        <body name="antibiotic_box${i}" pos="${x} ${y} 0.015">
            <freejoint/>
            <!-- Main Box: Clean White Cardboard -->
            <geom name="antibiotic_body${i}" type="box" size="0.05 0.03 0.015" rgba="1 1 1 1" mass="0.050" friction="1.2 0.3 0.1" material="box_cardboard_mat"/>
            
            <!-- Box Flaps & Edges -->
            <geom type="box" size="0.001 0.031 0.016" pos="0.05 0 0" rgba="0.9 0.9 0.9 1"/>
            <geom type="box" size="0.001 0.031 0.016" pos="-0.05 0 0" rgba="0.9 0.9 0.9 1"/>
            
            <!-- Color Coding Band (Teal for Antibiotics) -->
            <geom type="box" size="0.051 0.008 0.016" pos="0 0.022 0" rgba="0 0.5 0.5 1"/>
            
            <!-- Main Label Area -->
            <geom type="box" size="0.045 0.001 0.025" pos="0 0.031 0" material="medical_label_mat"/>
            
            <!-- Pharmacy Branding -->
            <geom type="box" size="0.035 0.0012 0.005" pos="0 0.032 0.008" rgba="0.1 0.1 0.1 1"/> <!-- "AMOXICILLIN" -->
            <geom type="box" size="0.02 0.0012 0.002" pos="-0.015 0.032 0.001" rgba="0.3 0.3 0.3 1"/> <!-- "500mg" -->
            
            <!-- Security Hologram / Seal -->
            <geom type="box" size="0.005 0.005 0.001" pos="0.04 0.025 0.016" rgba="0.7 0.9 1 0.8" material="tool_metal_mat"/>
            
            <!-- Dosage Info & Barcode -->
            <body name="antibiotic_info_${i}" pos="0 0.032 -0.008">
                <geom type="box" size="0.03 0.001 0.0015" pos="0 0 0.002" rgba="0.4 0.4 0.4 1"/>
                <geom type="box" size="0.03 0.001 0.0015" pos="0 0 -0.002" rgba="0.4 0.4 0.4 1"/>
                <geom type="box" size="0.012 0.001 0.006" pos="0.03 0 -0.002" rgba="0.1 0.1 0.1 1"/> <!-- Barcode -->
            </body>
            
            <!-- Rx Symbol -->
            <body name="rx_symbol_${i}" pos="-0.038 0.032 -0.008">
                <geom type="box" size="0.004 0.001 0.001" rgba="0.8 0.1 0.1 1"/>
                <geom type="box" size="0.001 0.001 0.004" pos="0.001 0 0" rgba="0.8 0.1 0.1 1"/>
            </body>
        </body>`
    }
];
