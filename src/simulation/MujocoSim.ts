/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import * as THREE from 'three';
import { DragStateManager } from './DragStateManager';
import { IkSystem } from './IkSystem';
import { RenderSystem } from './RenderSystem';
import { RobotLoader } from './RobotLoader';
import { SelectionManager } from './SelectionManager';
import { SequenceAnimator } from './SequenceAnimator';
import { MujocoData, MujocoModel, MujocoModule } from '../../types';
import { DisasterType } from './CrisisSpawnZones';
import { getName } from '../../utils/StringUtils';

/**
 * MujocoSim: The Central Orchestrator.
 * Manages the connection between the MuJoCo WASM engine and the Three.js visualization.
 */
export class MujocoSim {
    mujoco: MujocoModule;      
    mjModel: MujocoModel | null = null;     
    mjData: MujocoData | null = null;      
    mjvOption: InstanceType<MujocoModule['MjvOption']>;   

    renderSys: RenderSystem;
    ikSys: IkSystem;
    dragStateManager: DragStateManager;
    selectionManager: SelectionManager;
    sequenceAnimator: SequenceAnimator;

    frameId: number | null = null; 
    paused = false;
    gripperActuatorId = -1;
    speedMultiplier = 1;
    
    private userIkEnabled = false; 
    private firstIkEnable = true; // Track first enable to enforce default rotation

    // Gizmo Interpolation State
    private gizmoAnim = {
        active: false,
        startPos: new THREE.Vector3(),
        endPos: new THREE.Vector3(),
        startRot: new THREE.Quaternion(),
        endRot: new THREE.Quaternion(),
        startTime: 0,
        duration: 1000
    };

    constructor(container: HTMLElement, mujocoInstance: MujocoModule) {
        this.mujoco = mujocoInstance;
        this.mjvOption = new this.mujoco.MjvOption();
        
        this.renderSys = new RenderSystem(container, this.mujoco);
        
        this.dragStateManager = new DragStateManager(this.renderSys.scene, this.renderSys.renderer, this.renderSys.camera, container, this.renderSys.controls);
        this.selectionManager = new SelectionManager(this.renderSys.scene, this.renderSys.renderer, this.renderSys.camera, container);
        
        this.ikSys = new IkSystem(this.mujoco, this.renderSys.camera, this.renderSys.renderer.domElement, this.renderSys.controls);
        this.renderSys.simGroup.add(this.ikSys.target); 
        this.renderSys.scene.add(this.ikSys.control as unknown as THREE.Object3D);
        
        this.sequenceAnimator = new SequenceAnimator();
        
        this.renderSys.initLights(this.dragStateManager);
    }

    async init(robotId = 'franka_emika_panda', sceneFile = 'scene.xml', disasterType: DisasterType = 'flood', supplyLevel: 'low' | 'medium' | 'high' = 'high', onProgress?: (msg: string) => void) {
        console.log(`[MujocoSim] Initializing with robot: ${robotId}, scene: ${sceneFile}, disaster: ${disasterType}, supply: ${supplyLevel}`);
        const loader = new RobotLoader(this.mujoco);
        const { isDouble, isStacking } = await loader.load(robotId, sceneFile, disasterType, supplyLevel, onProgress);

        try {
            this.mjModel = this.mujoco.MjModel.loadFromXML(`/working/${sceneFile}`);
            this.mjData = new this.mujoco.MjData(this.mjModel);
        } catch (e: unknown) { 
            const msg = e instanceof Error ? e.message : (typeof e === 'string' ? e : 'Unknown MuJoCo error');
            throw new Error(`Failed to load model: ${msg}`); 
        }

        if (this.mjModel) {
            this.ikSys.gripperSiteId = -1; 
            this.gripperActuatorId = -1;
            for (let i = 0; i < this.mjModel.nsite; i++) {
                 if (getName(this.mjModel, this.mjModel.name_siteadr[i]).includes('tcp')) { 
                     this.ikSys.gripperSiteId = i; break; 
                 }
            }
            for (let i = 0; i < this.mjModel.nu; i++) {
                 if (getName(this.mjModel, this.mjModel.name_actuatoradr[i]).includes('gripper')) { 
                     this.gripperActuatorId = i; break; 
                 }
            }

            // Set Initial Pose
            this.setInitialPose();

            this.mujoco.mj_forward(this.mjModel, this.mjData!);
            this.renderSys.initScene(this.mjModel);
            this.ikSys.init(this.mjModel, isDouble);
            this.ikSys.syncToSite(this.mjData!);
            
            this.ikSys.target.quaternion.setFromEuler(new THREE.Euler(Math.PI, 0, 0));
            this.ikSys.target.position.set(0, 0, 0.45);

            this.firstIkEnable = true;
            
            this.sequenceAnimator.init(this.mjModel, isStacking, (addr) => getName(this.mjModel!, addr));
            
            this.startLoop();
        }
    }
    
    private setInitialPose() {
        if (!this.mjModel || !this.mjData) return;
        
        // Set a more dynamic "mid-action" pose for the Franka Panda
        // Reaching slightly towards the sorting zones
        const activePose = [
            0.5,    // joint 1
            0.2,    // joint 2
            0.0,    // joint 3
            -1.8,   // joint 4
            0.0,    // joint 5
            2.0,    // joint 6
            0.8,    // joint 7
            0.04,   // gripper 1
            0.04    // gripper 2
        ];
        
        for (let i = 0; i < Math.min(activePose.length, this.mjModel.nu); i++) {
            this.mjData.ctrl[i] = activePose[i];
            if (this.mjModel.actuator_trnid[2 * i + 1] === 1) {
                const jointId = this.mjModel.actuator_trnid[2 * i];
                if (jointId >= 0 && jointId < this.mjModel.njnt) {
                    const qposAdr = this.mjModel.jnt_qposadr[jointId];
                    this.mjData.qpos[qposAdr] = activePose[i];
                }
            }
        }
    }

    private startLoop() {
        if (this.frameId) cancelAnimationFrame(this.frameId);

        const loop = () => {
            if (!this.mjModel || !this.mjData) {
                 this.frameId = requestAnimationFrame(loop);
                 return;
            }

            this.dragStateManager.update();
            if (this.draggedBodyId() !== null) this.mjData.xfrc_applied.fill(0);
            if (this.dragStateManager.active && this.dragStateManager.physicsObject) {
                this.applyDragForce();
            }
            
            if (this.gizmoAnim.active) {
                const now = performance.now();
                const elapsed = now - this.gizmoAnim.startTime;
                const t = Math.min(elapsed / this.gizmoAnim.duration, 1.0);
                const ease = 1 - Math.pow(1 - t, 3);
                
                this.ikSys.target.position.lerpVectors(this.gizmoAnim.startPos, this.gizmoAnim.endPos, ease);
                this.ikSys.target.quaternion.slerpQuaternions(this.gizmoAnim.startRot, this.gizmoAnim.endRot, ease);
                
                if (t >= 1.0) {
                    this.gizmoAnim.active = false;
                }
            }

            if (!this.paused) {
                if (this.sequenceAnimator.running) {
                    this.sequenceAnimator.update((1/60) * this.speedMultiplier, this.ikSys.target, this.mjData, this.gripperActuatorId, this.ikSys);
                    this.setIkEnabled(false);
                } else {
                     this.syncIkState();
                     this.ikSys.update(this.mjModel, this.mjData);
                }

                const startSimTime = this.mjData.time;
                // Allow simulation to run faster than real-time based on speedMultiplier
                while (this.mjData.time - startSimTime < (1.0 / 60.0) * this.speedMultiplier) {
                    this.mujoco.mj_step(this.mjModel, this.mjData);
                }
            }

            this.renderSys.update(this.mjData, this.renderSys.contactMarkers.visible);
            this.frameId = requestAnimationFrame(loop);
        };
        this.frameId = requestAnimationFrame(loop);
    }

    private draggedBodyId(): number | null { 
        return this.dragStateManager.active && this.dragStateManager.physicsObject ? this.dragStateManager.physicsObject.userData.bodyID : null; 
    }

    private applyDragForce() {
        if (!this.mjData) return;
        const bodyId = this.draggedBodyId()!;
        const force = new THREE.Vector3().subVectors(this.dragStateManager.currentWorld, this.dragStateManager.worldHit).multiplyScalar(1.5);
        if (force.lengthSq() > 25) force.setLength(5.0); 
        
        const bodyPos = new THREE.Vector3().fromArray(this.mjData.xpos, bodyId * 3);
        const leverArm = new THREE.Vector3().subVectors(this.dragStateManager.worldHit, bodyPos);
        const torque = leverArm.cross(force);

        this.mjData.xfrc_applied.set([force.x, force.y, force.z, torque.x, torque.y, torque.z], bodyId * 6);
    }
    
    private syncIkState() {
        const shouldCalculate = this.userIkEnabled;
        const shouldShowGizmo = this.userIkEnabled && !this.gizmoAnim.active && !this.sequenceAnimator.running; 
        
        this.ikSys.setCalculating(shouldCalculate);
        this.ikSys.setGizmoVisible(shouldShowGizmo);
        
        if (this.sequenceAnimator.running) {
            this.ikSys.setTargetVisible(true);
        } else if(shouldCalculate) {
            this.ikSys.setTargetVisible(true);
        }
    }

    moveIkTargetTo(pos: THREE.Vector3, duration = 0) {
        if (!this.userIkEnabled) {
            this.setIkEnabled(true);
        }
        
        const targetPos = new THREE.Vector3(pos.x, pos.y, pos.z + 0.05);
        const targetRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI, 0, 0));

        if (duration > 0) {
            this.gizmoAnim.active = true;
            this.gizmoAnim.startPos.copy(this.ikSys.target.position);
            this.gizmoAnim.endPos.copy(targetPos);
            this.gizmoAnim.startRot.copy(this.ikSys.target.quaternion);
            this.gizmoAnim.endRot.copy(targetRot);
            this.gizmoAnim.startTime = performance.now();
            this.gizmoAnim.duration = duration;
        } else {
            this.gizmoAnim.active = false;
            this.ikSys.target.position.copy(targetPos);
            this.ikSys.target.quaternion.copy(targetRot);
        }
    }

    pickupItems(positions: THREE.Vector3[], markerIds: number[], onFinished?: () => void, targetPositions?: THREE.Vector3[]) {
        if (this.sequenceAnimator && this.mjData) {
            this.ikSys.syncToSite(this.mjData);
            this.sequenceAnimator.start(
                this.ikSys.target, 
                this.mjData, 
                this.ikSys, 
                { positions, targetPositions, markerIds }, 
                (markerId) => {
                    this.renderSys.removeMarkerById(markerId);
                },
                onFinished
            );
            this.setIkEnabled(false);
        }
    }

    reset() {
        if (!this.mjModel || !this.mjData) return;
        this.renderSys.clearErMarkers();
        this.gizmoAnim.active = false;
        this.sequenceAnimator.reset(); 
        this.mujoco.mj_resetData(this.mjModel, this.mjData);
        this.setInitialPose();
        this.mujoco.mj_forward(this.mjModel, this.mjData); 
        this.ikSys.syncToSite(this.mjData);
        
        this.ikSys.target.quaternion.setFromEuler(new THREE.Euler(Math.PI, 0, 0));
        this.ikSys.target.position.set(0, 0, 0.45);
        this.firstIkEnable = true;
    }
    
    togglePause() { return this.paused = !this.paused; }
    
    setIkEnabled(enabled: boolean) {
        this.userIkEnabled = enabled;
        this.syncIkState();
        if (enabled && this.mjData && !this.gizmoAnim.active && !this.sequenceAnimator.running) {
            if (this.firstIkEnable) {
                this.ikSys.target.quaternion.setFromEuler(new THREE.Euler(Math.PI, 0, 0));
                this.ikSys.target.position.set(0, 0, 0.45);
                this.firstIkEnable = false;
            } else {
                this.ikSys.syncToSite(this.mjData);
            }
        }
    }
    
    setSpeedMultiplier(speed: number) {
        this.speedMultiplier = speed;
    }
    
    getGizmoStats() { return this.ikSys.calculating && this.ikSys.target ? { pos: this.ikSys.target.position.clone(), rot: new THREE.Euler().setFromQuaternion(this.ikSys.target.quaternion) } : null; }
    
    startSequence(waypoints: [number, number, number][], onFinished?: () => void) {
        if (!this.mjModel || !this.mjData) return;
        const positions = waypoints.map(w => new THREE.Vector3(w[0], w[1], w[2]));
        const markerIds = waypoints.map((_, i) => i);
        this.sequenceAnimator.start(this.ikSys.target, this.mjData, this.ikSys, { positions, markerIds }, undefined, onFinished);
    }

    dispose() {
        if (this.frameId) cancelAnimationFrame(this.frameId);
        
        this.dragStateManager?.dispose(); 
        this.selectionManager?.dispose(); 
        this.renderSys?.dispose(); 
        this.ikSys?.dispose();
        
        // Use try-catch and nulling to prevent double-deletion errors
        if (this.mjvOption) {
            try { this.mjvOption.delete(); } catch (e) { /* ignore */ }
            (this as any).mjvOption = null;
        }
        if (this.mjModel) {
            try { this.mjModel.delete(); } catch (e) { /* ignore */ }
            (this as any).mjModel = null;
        }
        if (this.mjData) {
            try { this.mjData.delete(); } catch (e) { /* ignore */ }
            (this as any).mjData = null;
        }
        
        try { this.mujoco.FS.unmount('/working'); } catch (e) { /* ignore */ }
    }
}