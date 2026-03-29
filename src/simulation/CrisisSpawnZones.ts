/**
 * CrisisSpawnZones.ts
 * Defines the spatial zones for different categories of emergency supplies.
 */

export interface SpawnZone {
    id: string;
    name: string;
    description: string;
    center: { x: number, y: number };
    size: { width: number, height: number };
    categories: string[];
    color: string; // Hex or RGBA for visual markers
    label: string; // Short label for display
}

export const CRISIS_SPAWN_ZONES: SpawnZone[] = [
    {
        id: 'zone_medical',
        name: 'Medical Staging',
        description: 'Critical medical supplies and first aid kits',
        center: { x: 0.4, y: 0.4 },
        size: { width: 0.25, height: 0.25 },
        categories: ['medical', 'medical_advanced', 'ppe'],
        color: '0.2 0.4 1.0 0.1', // Blueish
        label: 'MED'
    },
    {
        id: 'zone_nutrition',
        name: 'Food & Water',
        description: 'Emergency rations and hydration supplies',
        center: { x: 0.4, y: -0.4 },
        size: { width: 0.25, height: 0.25 },
        categories: ['nutrition', 'hydration'],
        color: '0.2 0.8 0.2 0.1', // Greenish
        label: 'FOOD'
    },
    {
        id: 'zone_tools',
        name: 'Tools & Equipment',
        description: 'Rescue tools and communication equipment',
        center: { x: -0.4, y: 0.4 },
        size: { width: 0.25, height: 0.25 },
        categories: ['tools', 'equipment'],
        color: '1.0 0.6 0.2 0.1', // Orangish
        label: 'TOOL'
    },
    {
        id: 'zone_mixed',
        name: 'Mixed Emergency',
        description: 'General emergency response items',
        center: { x: -0.4, y: -0.4 },
        size: { width: 0.25, height: 0.25 },
        categories: ['medical', 'nutrition', 'tools', 'hydration', 'equipment', 'ppe'],
        color: '0.8 0.2 0.8 0.1', // Purplish
        label: 'MIX'
    }
];

export type DisasterType = 'flood' | 'earthquake' | 'wildfire' | 'hurricane' | 'conflict' | 'cyclone' | 'volcano' | 'drought' | 'facility';

export interface DisasterPreset {
    type: DisasterType;
    zoneWeights: Record<string, number>;
    itemCount: number;
}

export const DISASTER_PRESETS: Record<DisasterType, DisasterPreset> = {
    flood: {
        type: 'flood',
        zoneWeights: { zone_medical: 0.2, zone_nutrition: 0.4, zone_tools: 0.2, zone_mixed: 0.2 },
        itemCount: 15
    },
    earthquake: {
        type: 'earthquake',
        zoneWeights: { zone_medical: 0.4, zone_nutrition: 0.2, zone_tools: 0.3, zone_mixed: 0.1 },
        itemCount: 18
    },
    wildfire: {
        type: 'wildfire',
        zoneWeights: { zone_medical: 0.3, zone_nutrition: 0.2, zone_tools: 0.2, zone_mixed: 0.3 },
        itemCount: 14
    },
    hurricane: {
        type: 'hurricane',
        zoneWeights: { zone_medical: 0.2, zone_nutrition: 0.3, zone_tools: 0.3, zone_mixed: 0.2 },
        itemCount: 16
    },
    cyclone: {
        type: 'cyclone',
        zoneWeights: { zone_medical: 0.2, zone_nutrition: 0.3, zone_tools: 0.3, zone_mixed: 0.2 },
        itemCount: 16
    },
    conflict: {
        type: 'conflict',
        zoneWeights: { zone_medical: 0.5, zone_nutrition: 0.2, zone_tools: 0.1, zone_mixed: 0.2 },
        itemCount: 20
    },
    volcano: {
        type: 'volcano',
        zoneWeights: { zone_medical: 0.3, zone_nutrition: 0.3, zone_tools: 0.2, zone_mixed: 0.2 },
        itemCount: 12
    },
    drought: {
        type: 'drought',
        zoneWeights: { zone_medical: 0.1, zone_nutrition: 0.6, zone_tools: 0.1, zone_mixed: 0.2 },
        itemCount: 12
    },
    facility: {
        type: 'facility',
        zoneWeights: { zone_medical: 0.25, zone_nutrition: 0.25, zone_tools: 0.25, zone_mixed: 0.25 },
        itemCount: 14
    }
};
