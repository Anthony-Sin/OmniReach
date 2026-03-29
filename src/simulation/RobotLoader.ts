/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import { MujocoModule } from "../../types";
import { SpawnLayoutGenerator } from "./SpawnLayoutGenerator";
import { DisasterType } from "./CrisisSpawnZones";

/**
 * RobotLoader
 * Handles fetching robot XML files and their dependencies (meshes, textures) from remote URLs.
 * It writes these files into MuJoCo's in-memory virtual filesystem so the C++ engine can read them.
 */
export class RobotLoader {
    private mujoco: MujocoModule;

    constructor(mujocoInstance: MujocoModule) {
        this.mujoco = mujocoInstance;
    }

    /**
     * Main entry point. Downloads the main scene XML and recursively finds/downloads all included files.
     * @param onProgress Optional callback to report loading progress string.
     */
    async load(robotId: string, sceneFile: string, disasterType: DisasterType = 'flood', supplyLevel: 'low' | 'medium' | 'high' = 'high', onProgress?: (msg: string) => void): Promise<{ isDouble: boolean, isStacking: boolean }> {
        // 1. Clean up the virtual filesystem from previous runs
        try { this.mujoco.FS.unmount('/working'); } catch (e) { /* ignore */ }
        try { this.mujoco.FS.mkdir('/working'); } catch (e) { /* ignore */ }

        const isDouble = false;
        const isStacking = robotId === 'franka_panda_stack';
        // Base URL for standard models from DeepMind's repository
        const currentRobotId = isStacking ? 'franka_emika_panda' : robotId;
        const baseUrl = `https://raw.githubusercontent.com/google-deepmind/mujoco_menagerie/main/${currentRobotId}/`;

        const downloaded = new Set<string>(); // Keep track to avoid re-downloading same file twice
        const queue: Array<string> = []; // Queue of files to process
        const parser = new DOMParser(); // For parsing XML to find dependencies

        queue.push(sceneFile);

        // Process queue until all dependencies are downloaded
        while (queue.length > 0) {
            const fname = queue.shift()!;
            if (downloaded.has(fname)) continue;
            downloaded.add(fname);

            if (onProgress) {
                onProgress(`Downloading ${fname}...`);
            }

            // Fetch file from network with timeout
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
                
                const res = await fetch(baseUrl + fname, { signal: controller.signal });
                clearTimeout(timeoutId);

                if (!res.ok) {
                    console.warn(`Failed to fetch ${fname}: ${res.status} ${res.statusText}`);
                    if (fname === sceneFile) {
                        throw new Error(`Critical file ${fname} failed to download.`);
                    }
                    continue;
                }

                // Ensure virtual directory structure exists (e.g., /working/assets/meshes/)
                const dirParts = fname.split('/');
                dirParts.pop(); // remove filename
                let currentPath = '/working';
                for (const part of dirParts) {
                    currentPath += '/' + part;
                    try { this.mujoco.FS.mkdir(currentPath); } catch (e) { /* ignore */ }
                }

                // If it's an XML, we might need to patch it and scan it for more dependencies
                if (fname.endsWith('.xml')) {
                    let text = await res.text();
                    text = this.patchSingleRobot(fname, sceneFile, isStacking, text, disasterType, supplyLevel);
                    
                    // Write text file to virtual FS
                    this.mujoco.FS.writeFile(`/working/${fname}`, text);
                    // Scan for <include file="...">, <mesh file="...">, etc.
                    this.scanDependencies(text, fname, parser, downloaded, queue);
                } else {
                    // Binary files (STL, PNG) just get written directly
                    const buffer = new Uint8Array(await res.arrayBuffer());
                    this.mujoco.FS.writeFile(`/working/${fname}`, buffer);
                }
            } catch (err: unknown) {
                console.error(`Error processing ${fname}:`, err);
                if (fname === sceneFile) {
                    throw new Error(`Failed to load main scene: ${err instanceof Error ? err.message : 'Unknown error'}`);
                }
            }
        }
        return { isDouble, isStacking };
    }

    // Modifies the standard XMLs to add our specific demo objects (cubes, trays)
    private patchSingleRobot(fname: string, sceneFile: string, isStacking: boolean, text: string, disasterType: DisasterType, supplyLevel: 'low' | 'medium' | 'high'): string {
        if (fname === sceneFile) {
            let assetInjection = '';
            let bodyInjection = '';
            
            // Warehouse layout:
            // 1. A "Shelf" or storage area for items
            // 2. A "Delivery Box" (tray) for the robot to put things in
            
            // Inject Assets (Materials)
            assetInjection += `
            <asset>
                <!-- Materials without textures to avoid conflicts -->
                <material name="water_label_mat" rgba="0.9 0.9 1 1" shininess="0.02" specular="0.05" reflectance="0.01"/>
                <material name="food_label_mat" rgba="1 0.9 0.8 1" shininess="0.02" specular="0.05" reflectance="0.01"/>
                <material name="medical_label_mat" rgba="1 1 1 1" shininess="0.02" specular="0.05" reflectance="0.01"/>
                <material name="tool_metal_mat" rgba="0.5 0.5 0.5 1" shininess="0.2" specular="0.2" reflectance="0.05"/>
                <material name="box_cardboard_mat" rgba="0.6 0.4 0.2 1" shininess="0.0" specular="0.0" reflectance="0.0"/>
                <material name="plastic_mat" rgba="0.8 0.8 0.8 1" shininess="0.05" specular="0.1" reflectance="0.02"/>
                <material name="fabric_mat" rgba="0.3 0.3 0.3 1" shininess="0.0" specular="0.0" reflectance="0.0"/>
            </asset>
            `;

            // Delivery Box (Tray) - Positioned on top of the conveyor belt
            bodyInjection += `<body name="delivery_box" pos="0 0.55 0.32">
                <geom type="box" size="0.12 0.12 0.005" pos="0 0 0.005" material="box_cardboard_mat"/>
                <geom type="box" size="0.12 0.005 0.04" pos="0 0.12 0.04" material="box_cardboard_mat"/>
                <geom type="box" size="0.12 0.005 0.04" pos="0 -0.12 0.04" material="box_cardboard_mat"/>
                <geom type="box" size="0.005 0.12 0.04" pos="0.12 0 0.04" material="box_cardboard_mat"/>
                <geom type="box" size="0.005 0.12 0.04" pos="-0.12 0 0.04" material="box_cardboard_mat"/>
            </body>`;

            // Inject environment decorations (crates, pallets, tape)
            bodyInjection += SpawnLayoutGenerator.generateEnvironmentDecorations();
            
            // Inject survival items using the new crisis layout generator
            const spawnedItems = SpawnLayoutGenerator.generate(disasterType, supplyLevel);
            spawnedItems.forEach((item, index) => {
                bodyInjection += item.xml(index, item.x, item.y, item.z, item.rotation);
            });

            // Inject assets before worldbody
            text = text.replace('<worldbody>', assetInjection + '<worldbody>');
            // Inject bodies inside worldbody
            text = text.replace('</worldbody>', bodyInjection + '</worldbody>');
        }
        // Ensure Panda has a named gripper actuator and a TCP site for IK
        if (fname.endsWith('panda.xml')) {
            text = text.replace(/(<body[^>]*name=["']hand["'][^>]*>)/, '$1<site name="tcp" pos="0 0 0.1" size="0.01" rgba="1 0 0 0.5" group="1"/>').replace(/name=["']actuator8["']/, 'name="gripper"');
        }
        return text;
    }

    // Finds all files referenced in the XML so we can download them too
    private scanDependencies(xmlString: string, currentFile: string, parser: DOMParser, downloaded: Set<string>, queue: string[]) {
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
        
        // Check if the XML defines specific directories for assets
        const compiler = xmlDoc.querySelector('compiler');
        const meshDir = compiler?.getAttribute('meshdir') || '';
        const textureDir = compiler?.getAttribute('texturedir') || '';
        
        // Calculate relative path of current file
        const currentDir = currentFile.includes('/') ? currentFile.substring(0, currentFile.lastIndexOf('/') + 1) : '';

        // Find all elements with a 'file' attribute
        xmlDoc.querySelectorAll('[file]').forEach(el => {
            const fileAttr = el.getAttribute('file');
            if (!fileAttr) return;
            
            // Prepend appropriate directory based on tag type
            let prefix = '';
            if (el.tagName.toLowerCase() === 'mesh') {
                prefix = meshDir ? meshDir + '/' : '';
            } else if (['texture', 'hfield'].includes(el.tagName.toLowerCase())) {
                prefix = textureDir ? textureDir + '/' : '';
            }
            
            // Normalize path (resolve '..' and '.')
            let fullPath = (currentDir + prefix + fileAttr).replace(/\/\//g, '/');
            const parts = fullPath.split('/');
            const norm: string[] = [];
            for (const p of parts) { if (p === '..') norm.pop(); else if (p !== '.') norm.push(p); }
            fullPath = norm.join('/');
            
            // Add to queue if we haven't seen it yet
            if (!downloaded.has(fullPath)) queue.push(fullPath);
        });
    }
}
