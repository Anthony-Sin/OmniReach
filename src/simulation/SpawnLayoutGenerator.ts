/**
 * SpawnLayoutGenerator.ts
 * Generates realistic crisis-style layouts for emergency supplies.
 */

import { CRISIS_SPAWN_ZONES, DisasterType, DISASTER_PRESETS, SpawnZone } from './CrisisSpawnZones';
import { allItems, getItemsByKeyword, getItemByName } from '../assets/items';

export interface SpawnedItem {
    id: number;
    name: string;
    category: string;
    x: number;
    y: number;
    z: number;
    rotation: number; // in radians (Z-axis)
    xml: (i: number, x: number, y: number, z: number, rotation: number) => string;
}

export const WORKSPACE_SHELF_SLOTS = [
    // Left shelf outer row
    { x: -0.68, y: -0.54, z: 0.32, rot: Math.PI / 2 },
    { x: -0.68, y: -0.38, z: 0.32, rot: Math.PI / 2 },
    { x: -0.68, y: -0.22, z: 0.32, rot: Math.PI / 2 },
    { x: -0.68, y: -0.06, z: 0.32, rot: Math.PI / 2 },
    { x: -0.68, y: 0.10, z: 0.32, rot: Math.PI / 2 },
    { x: -0.68, y: 0.26, z: 0.32, rot: Math.PI / 2 },

    // Left shelf inner row
    { x: -0.52, y: -0.50, z: 0.32, rot: Math.PI / 2 },
    { x: -0.52, y: -0.32, z: 0.32, rot: Math.PI / 2 },
    { x: -0.52, y: -0.14, z: 0.32, rot: Math.PI / 2 },
    { x: -0.52, y: 0.04, z: 0.32, rot: Math.PI / 2 },
    { x: -0.52, y: 0.22, z: 0.32, rot: Math.PI / 2 },

    // Back shelf row
    { x: -0.54, y: -0.68, z: 0.32, rot: Math.PI },
    { x: -0.38, y: -0.68, z: 0.32, rot: Math.PI },
    { x: -0.22, y: -0.68, z: 0.32, rot: Math.PI },
    { x: -0.06, y: -0.68, z: 0.32, rot: Math.PI },
    { x: 0.10, y: -0.68, z: 0.32, rot: Math.PI },
    { x: 0.26, y: -0.68, z: 0.32, rot: Math.PI },
    { x: 0.42, y: -0.68, z: 0.32, rot: Math.PI },
    { x: 0.58, y: -0.68, z: 0.32, rot: Math.PI },

    // Right shelf inner row
    { x: 0.52, y: -0.50, z: 0.32, rot: Math.PI / 2 },
    { x: 0.52, y: -0.32, z: 0.32, rot: Math.PI / 2 },
    { x: 0.52, y: -0.14, z: 0.32, rot: Math.PI / 2 },
    { x: 0.52, y: 0.04, z: 0.32, rot: Math.PI / 2 },
    { x: 0.52, y: 0.22, z: 0.32, rot: Math.PI / 2 },

    // Right shelf outer row
    { x: 0.68, y: -0.54, z: 0.32, rot: Math.PI / 2 },
    { x: 0.68, y: -0.38, z: 0.32, rot: Math.PI / 2 },
    { x: 0.68, y: -0.22, z: 0.32, rot: Math.PI / 2 },
    { x: 0.68, y: -0.06, z: 0.32, rot: Math.PI / 2 },
    { x: 0.68, y: 0.10, z: 0.32, rot: Math.PI / 2 },
    { x: 0.68, y: 0.26, z: 0.32, rot: Math.PI / 2 }
] as const;

export class SpawnLayoutGenerator {
    private static readonly LARGE_ITEM_NAMES = new Set(['shovel', 'safety_boots']);

    /**
     * Generates a list of items with randomized positions and rotations.
     * Places items on racks and pallets in a warehouse layout.
     */
    static generate(disasterType: DisasterType = 'flood'): SpawnedItem[] {
        const spawnedItems: SpawnedItem[] = [];
        const slots = WORKSPACE_SHELF_SLOTS;
        const disasterRelevant = getItemsByKeyword(disasterType)
            .filter(item => !this.LARGE_ITEM_NAMES.has(item.name));
        const remainingItems = allItems.filter(
            item => !this.LARGE_ITEM_NAMES.has(item.name) && !disasterRelevant.some(candidate => candidate.name === item.name)
        );
        const itemTemplates = [...disasterRelevant, ...remainingItems];
        const itemsToSpawn = itemTemplates.flatMap(item => [item, item]).slice(0, slots.length);

        for (let i = 0; i < slots.length; i++) {
            const itemTemplate = itemsToSpawn[i];
            const slot = slots[i];

            // Wrap the original XML function to support rotation and Z
            const originalXml = itemTemplate.xml;
            const wrappedXml = (i: number, x: number, y: number, z: number, rot: number) => {
                const xmlStr = originalXml(i, x, y);
                return xmlStr.replace(/<body ([^>]+)>/, (match, attrs) => {
                    // Extract existing euler if it exists
                    const eulerMatch = attrs.match(/euler="([^"]+)"/);
                    let euler = [0, 0, 0];
                    if (eulerMatch) {
                        euler = eulerMatch[1].split(' ').map(Number);
                    }
                    // Add the Z rotation from the generator (yaw)
                    euler[2] += rot * 180 / Math.PI;

                    // Clean up and rebuild attributes
                    let newAttrs = attrs
                        .replace(/pos="[^"]*"/, `pos="${x} ${y} ${z}"`)
                        .replace(/euler="[^"]*"/, `euler="${euler.join(' ')}"`)
                        .replace(/quat="[^"]*"/, ''); // Remove quat to avoid conflicts with euler
                    
                    // If euler wasn't there to be replaced, add it
                    if (!newAttrs.includes('euler=')) {
                        newAttrs += ` euler="${euler.join(' ')}"`;
                    }
                    
                    return `<body ${newAttrs}>`;
                });
            };

            spawnedItems.push({
                id: i,
                name: itemTemplate.name,
                category: itemTemplate.category,
                x: slot.x,
                y: slot.y,
                z: slot.z,
                rotation: slot.rot,
                xml: wrappedXml
            });
        }

        return spawnedItems;
    }

    /**
     * Generates visual elements for the staging area.
     * Creates industrial racks, pallets, and safety markings.
     */
    static generateEnvironmentDecorations(): string {
        let decorationXml = '';

        // 1. Warehouse Walls (Large enclosure)
        decorationXml += `
        <body name="warehouse_structure" pos="0 0 0">
            <!-- Floor (Concrete) -->
            <geom type="plane" size="5 5 0.1" pos="0 0 0" rgba="0.2 0.2 0.22 1" group="1"/>
            
            <!-- Walls -->
            <geom type="box" size="0.1 5 2.5" pos="4.9 0 2.5" rgba="0.3 0.3 0.35 1" group="1"/>
            <geom type="box" size="0.1 5 2.5" pos="-4.9 0 2.5" rgba="0.3 0.3 0.35 1" group="1"/>
            <geom type="box" size="5 0.1 2.5" pos="0 4.9 2.5" rgba="0.3 0.3 0.35 1" group="1"/>
            <geom type="box" size="5 0.1 2.5" pos="0 -4.9 2.5" rgba="0.3 0.3 0.35 1" group="1"/>
            
            <!-- Ceiling Beams -->
            <geom type="box" size="5 0.05 0.05" pos="0 2 4.9" rgba="0.1 0.1 0.1 1" group="1"/>
            <geom type="box" size="5 0.05 0.05" pos="0 -2 4.9" rgba="0.1 0.1 0.1 1" group="1"/>
            <geom type="box" size="0.05 5 0.05" pos="2 0 4.9" rgba="0.1 0.1 0.1 1" group="1"/>
            <geom type="box" size="0.05 5 0.05" pos="-2 0 4.9" rgba="0.1 0.1 0.1 1" group="1"/>
        </body>`;

        // 2. Continuous U-Shaped Industrial Rack
        decorationXml += `
        <body name="u_rack" pos="0 0 0">
            <!-- Vertical Supports (Orange) -->
            <!-- Back Corners -->
            <geom type="box" size="0.015 0.015 0.2" pos="0.8 -0.8 0.2" rgba="1 0.4 0 1"/>
            <geom type="box" size="0.015 0.015 0.2" pos="-0.8 -0.8 0.2" rgba="1 0.4 0 1"/>
            <!-- Front Corners -->
            <geom type="box" size="0.015 0.015 0.2" pos="0.8 0.4 0.2" rgba="1 0.4 0 1"/>
            <geom type="box" size="0.015 0.015 0.2" pos="-0.8 0.4 0.2" rgba="1 0.4 0 1"/>
            <!-- Middle Supports -->
            <geom type="box" size="0.015 0.015 0.2" pos="0.8 -0.2 0.2" rgba="1 0.4 0 1"/>
            <geom type="box" size="0.015 0.015 0.2" pos="-0.8 -0.2 0.2" rgba="1 0.4 0 1"/>
            
            <!-- Horizontal Beams (Orange) -->
            <!-- Left -->
            <geom type="box" size="0.01 0.6 0.01" pos="-0.8 -0.2 0.3" rgba="1 0.4 0 1"/>
            <geom type="box" size="0.01 0.6 0.01" pos="-0.5 -0.2 0.3" rgba="1 0.4 0 1"/>
            <!-- Right -->
            <geom type="box" size="0.01 0.6 0.01" pos="0.8 -0.2 0.3" rgba="1 0.4 0 1"/>
            <geom type="box" size="0.01 0.6 0.01" pos="0.5 -0.2 0.3" rgba="1 0.4 0 1"/>
            <!-- Back -->
            <geom type="box" size="0.8 0.01 0.01" pos="0 -0.8 0.3" rgba="1 0.4 0 1"/>
            <geom type="box" size="0.8 0.01 0.01" pos="0 -0.5 0.3" rgba="1 0.4 0 1"/>
            
            <!-- Shelf Surface (Gray) -->
            <!-- Left Segment -->
            <geom type="box" size="0.15 0.6 0.01" pos="-0.65 -0.2 0.3" rgba="0.4 0.4 0.4 1"/>
            <!-- Right Segment -->
            <geom type="box" size="0.15 0.6 0.01" pos="0.65 -0.2 0.3" rgba="0.4 0.4 0.4 1"/>
            <!-- Back Segment -->
            <geom type="box" size="0.8 0.15 0.01" pos="0 -0.65 0.3" rgba="0.4 0.4 0.4 1"/>
        </body>`;

        // 4. Safety Markings (Yellow Lines & Path Markers)
        decorationXml += `
        <body name="safety_lines" pos="0 0 0.002">
            <!-- Main Work Zone -->
            <geom type="box" size="0.8 0.8 0.001" pos="0 0 0" rgba="1 0.8 0 0.1" group="1"/>
            
            <!-- Perimeter Lines -->
            <geom type="box" size="1.2 0.02 0.001" pos="0 1.2 0" rgba="1 0.8 0 0.8" group="1"/>
            <geom type="box" size="1.2 0.02 0.001" pos="0 -1.2 0" rgba="1 0.8 0 0.8" group="1"/>
            <geom type="box" size="0.02 1.2 0.001" pos="1.2 0 0" rgba="1 0.8 0 0.8" group="1"/>
            <geom type="box" size="0.02 1.2 0.001" pos="-1.2 0 0" rgba="1 0.8 0 0.8" group="1"/>

            <!-- Robot Path Markers (Blue dashed lines) -->
            <geom type="box" size="0.05 0.01 0.001" pos="0 0.9 0" rgba="0 0.5 1 0.5" group="1"/>
            <geom type="box" size="0.05 0.01 0.001" pos="0.2 0.9 0" rgba="0 0.5 1 0.5" group="1"/>
            <geom type="box" size="0.05 0.01 0.001" pos="-0.2 0.9 0" rgba="0 0.5 1 0.5" group="1"/>
            <geom type="box" size="0.01 0.05 0.001" pos="0.9 0 0" rgba="0 0.5 1 0.5" group="1"/>
            <geom type="box" size="0.01 0.05 0.001" pos="0.9 0.2 0" rgba="0 0.5 1 0.5" group="1"/>
            <geom type="box" size="0.01 0.05 0.001" pos="0.9 -0.2 0" rgba="0 0.5 1 0.5" group="1"/>
        </body>`;

        // 5. Conveyor Belt (Functional looking)
        decorationXml += `
        <body name="conveyor_belt" pos="0 0.55 0">
            <!-- Belt Surface -->
            <geom type="box" size="1.5 0.15 0.02" pos="0 0 0.3" rgba="0.1 0.1 0.1 1"/>
            <!-- Side Rails -->
            <geom type="box" size="1.5 0.01 0.04" pos="0 0.16 0.32" rgba="0.4 0.4 0.4 1"/>
            <geom type="box" size="1.5 0.01 0.04" pos="0 -0.16 0.32" rgba="0.4 0.4 0.4 1"/>
            <!-- Legs -->
            <geom type="box" size="0.02 0.02 0.15" pos="1.4 0.12 0.15" rgba="0.3 0.3 0.3 1"/>
            <geom type="box" size="0.02 0.02 0.15" pos="-1.4 0.12 0.15" rgba="0.3 0.3 0.3 1"/>
            <geom type="box" size="0.02 0.02 0.15" pos="1.4 -0.12 0.15" rgba="0.3 0.3 0.3 1"/>
            <geom type="box" size="0.02 0.02 0.15" pos="-1.4 -0.12 0.15" rgba="0.3 0.3 0.3 1"/>
            <!-- Rollers (Visual) -->
            <geom type="cylinder" size="0.01 0.14" pos="1.45 0 0.31" euler="90 0 0" rgba="0.2 0.2 0.2 1"/>
            <geom type="cylinder" size="0.01 0.14" pos="-1.45 0 0.31" euler="90 0 0" rgba="0.2 0.2 0.2 1"/>
        </body>`;

        // 6. Charging Station (Visual only)
        decorationXml += `
        <body name="charging_station" pos="-1.2 1.2 0">
            <geom type="box" size="0.15 0.15 0.05" pos="0 0 0.05" rgba="0.2 0.2 0.2 1"/>
            <geom type="box" size="0.05 0.05 0.4" pos="0 0 0.4" rgba="0.3 0.3 0.3 1"/>
            <geom type="box" size="0.06 0.06 0.02" pos="0 0 0.8" rgba="0 1 0 0.5"/> <!-- Green Status Light -->
        </body>`;

        // 6. Shipping Containers (Large boxes in the distance)
        decorationXml += `
        <body name="containers" pos="0 0 0">
            <geom type="box" size="1.2 0.5 0.5" pos="3.5 3.5 0.5" rgba="0.1 0.3 0.6 1" group="1"/>
            <geom type="box" size="1.2 0.5 0.5" pos="3.5 3.5 1.5" rgba="0.6 0.1 0.1 1" group="1"/>
            <geom type="box" size="1.2 0.5 0.5" pos="-3.5 3.5 0.5" rgba="0.1 0.5 0.2 1" group="1"/>
        </body>`;

        // 7. Overhead Industrial Lights (Visual only)
        decorationXml += `
        <body name="overhead_lights" pos="0 0 4.8">
            <geom type="cylinder" size="0.1 0.02" pos="2 2 0" rgba="0.9 0.9 1 1" group="1"/>
            <geom type="cylinder" size="0.1 0.02" pos="-2 2 0" rgba="0.9 0.9 1 1" group="1"/>
            <geom type="cylinder" size="0.1 0.02" pos="2 -2 0" rgba="0.9 0.9 1 1" group="1"/>
            <geom type="cylinder" size="0.1 0.02" pos="-2 -2 0" rgba="0.9 0.9 1 1" group="1"/>
        </body>`;

        return decorationXml;
    }
}
