
import { Agent, Tool } from '../lib/adk';
import { createEvent } from '../lib/agentUtils';
import { MissionEventType, PickSequenceCreatedPayload, PickStep, ArmExecutionStartedPayloadSchema, ArmExecutionCompletedPayloadSchema, AgentType } from '../types/mission';
import { RoboticsInputSchema, RoboticsOutputSchema } from '../types/adk';
import { missionStore } from '../lib/missionStore';
import { verifyBoxWithLoopAgent } from '../lib/sponsorWorkflows';
import { analyzeRoboticsWorkspace } from '../../services/geminiService';

interface RobotArm {
  armId: string;
  busy: boolean;
  missionId: string | null;
  startTime: number;
  currentStepCount: number;
}

const ARM_COUNT = 3;

export class RoboticsAgent {
  private static armPool: Map<string, RobotArm> = new Map();
  private static missionQueue: { missionId: string; payload: PickSequenceCreatedPayload; context: any }[] = [];
  private static missionContexts: Map<string, any> = new Map();

  static {
    for (let i = 1; i <= ARM_COUNT; i++) {
      const armId = `arm-${i}`;
      this.armPool.set(armId, {
        armId,
        busy: false,
        missionId: null,
        startTime: 0,
        currentStepCount: 0
      });
    }
  }

  private static broadcastArmStatus(armId: string, context: any) {
    const arm = this.armPool.get(armId);
    if (!arm) return;

    const event = createEvent(
      arm.missionId || 'system',
      AgentType.ROBOTICS,
      MissionEventType.ROBOT_ARM_STATUS,
      {
        armId: arm.armId,
        status: arm.busy ? 'BUSY' : 'IDLE',
        missionId: arm.missionId
      },
      { rationale: `Arm ${armId} status updated to ${arm.busy ? 'BUSY' : 'IDLE'}.` }
    );
    context.agent.sendMessage(AgentType.COORDINATOR, event);
  }

  static async execute(missionId: string, payload: PickSequenceCreatedPayload, context: any, armId?: string) {
    this.missionContexts.set(missionId, context);
    
    // 1. Find or validate arm
    let selectedArm: RobotArm | undefined;
    if (armId) {
      selectedArm = this.armPool.get(armId);
      if (!selectedArm) {
        this.fail(missionId, `Invalid armId: ${armId}`, 'unknown', context);
        return;
      }
      if (selectedArm.busy) {
        console.log(`[RoboticsAgent] Requested arm ${armId} is busy. Queueing mission ${missionId}.`);
        this.missionQueue.push({ missionId, payload, context });
        return;
      }
    } else {
      // Find first free arm
      for (const arm of this.armPool.values()) {
        if (!arm.busy) {
          selectedArm = arm;
          break;
        }
      }
    }

    // 2. Queue if no arm available
    if (!selectedArm) {
      console.log(`[RoboticsAgent] All arms busy. Queueing mission ${missionId}.`);
      this.missionQueue.push({ missionId, payload, context });
      return;
    }

    // 3. Assign and Start
    selectedArm.busy = true;
    selectedArm.missionId = missionId;
    selectedArm.startTime = Date.now();
    selectedArm.currentStepCount = payload.steps.length;
    
    this.broadcastArmStatus(selectedArm.armId, context);

    try {
      // 1. Preflight Checks
      console.log(`[RoboticsAgent] [${selectedArm.armId}] Running preflight checks for mission ${missionId}...`);
      this.preflightChecks(payload.steps);

      // 2. Notify Start
      const startPayload = { 
        plan: { steps: payload.steps },
        armId: selectedArm.armId,
        startPose: [0, 0, 0.45], // Default home pose
        targetPoses: payload.steps.map(s => s.target),
        safetyChecks: payload.safetyNotes,
        rollbackPlan: 'Return to home position'
      };

      // Validate start payload
      ArmExecutionStartedPayloadSchema.parse(startPayload);

      const startEvent = createEvent(
        missionId,
        AgentType.ROBOTICS,
        MissionEventType.ARM_EXECUTION_STARTED,
        startPayload,
        { rationale: `Initiating robotic arm sequence on ${selectedArm.armId} for kit assembly.` }
      );
      context.agent.sendMessage(AgentType.COORDINATOR, startEvent);

      console.log(`[RoboticsAgent] [${selectedArm.armId}] Waiting for browser simulation to complete ${payload.steps.length} steps.`);
      
      // In a real system, we might set a timeout here.
      // For now, we wait for handleExternalCompletion to be called via Socket.IO.

    } catch (error: any) {
      console.error(`[RoboticsAgent] [${selectedArm.armId}] Execution error: ${error.message}`);
      this.fail(missionId, error.message, selectedArm.armId, context);
    }
  }

  private static preflightChecks(steps: PickStep[]) {
    // Reachability check (simple radius check for now)
    const MAX_REACH = 0.85;
    const MIN_REACH = 0.15;
    
    for (const step of steps) {
      const sourceDist = Math.sqrt(step.source[0]**2 + step.source[1]**2 + step.source[2]**2);
      const targetDist = Math.sqrt(step.target[0]**2 + step.target[1]**2 + step.target[2]**2);
      
      if (sourceDist > MAX_REACH || targetDist > MAX_REACH) {
        throw new Error(`Target out of reach: ${step.item} at [${step.source.join(', ')}]`);
      }
      if (sourceDist < MIN_REACH || targetDist < MIN_REACH) {
        throw new Error(`Target too close to base (collision risk): ${step.item}`);
      }
    }
  }

  private static complete(missionId: string, armId: string, context: any, verification?: any) {
    const arm = this.armPool.get(armId);
    if (!arm) return;

    const mission = missionStore.getMission(missionId);
    if (mission && verification) {
      mission.data.boxVerification = {
        verified: verification.verified,
        summary: verification.summary,
        attempts: verification.attempts.length,
        detectedItems: verification.detectedItems,
        lastCheckedAt: Date.now()
      };
      missionStore.setMission(missionId, mission);
    }

    const completionPayload = { 
      success: true,
      stepsCompleted: arm.currentStepCount,
      totalSteps: arm.currentStepCount,
      finalPose: [0, 0, 0.45],
      executionTime: Date.now() - arm.startTime,
    };

    // Validate completion payload
    ArmExecutionCompletedPayloadSchema.parse(completionPayload);

    const completeEvent = createEvent(
      missionId,
      AgentType.ROBOTICS,
      MissionEventType.ARM_EXECUTION_COMPLETED,
      completionPayload,
      {
        rationale: verification?.summary
          ? `Robotic arm ${armId} finished all pick-and-place operations. ${verification.summary}`
          : `Robotic arm ${armId} has finished all pick-and-place operations.`
      }
    );
    context.agent.sendMessage(AgentType.COORDINATOR, completeEvent);

    this.freeArm(armId, context);
  }

  private static fail(missionId: string, reason: string, armId: string, context: any) {
    const failEvent = createEvent(
      missionId,
      AgentType.ROBOTICS,
      MissionEventType.MISSION_FAILED,
      { 
        reason: `Execution failed on arm ${armId}: ${reason}`,
        failedAgent: AgentType.ROBOTICS,
        errors: [reason],
        canRetry: true
      },
      { 
        status: 'ERROR',
        errors: [reason],
        rationale: `Execution failed on arm ${armId}: ${reason}`
      }
    );
    context.agent.sendMessage(AgentType.COORDINATOR, failEvent);
    this.missionContexts.delete(missionId);

    if (armId !== 'unknown') {
      this.freeArm(armId, context);
    }
  }

  private static freeArm(armId: string, context: any) {
    const arm = this.armPool.get(armId);
    if (arm) {
      arm.busy = false;
      arm.missionId = null;
      this.broadcastArmStatus(armId, context);
    }

    // Process next in queue
    this.processQueue();
  }

  private static processQueue() {
    if (this.missionQueue.length > 0) {
      // Find first free arm
      let freeArmId: string | null = null;
      for (const arm of this.armPool.values()) {
        if (!arm.busy) {
          freeArmId = arm.armId;
          break;
        }
      }

      if (freeArmId) {
        const nextMission = this.missionQueue.shift();
        if (nextMission) {
          console.log(`[RoboticsAgent] Dequeueing mission ${nextMission.missionId} for arm ${freeArmId}`);
          this.execute(nextMission.missionId, nextMission.payload, nextMission.context, freeArmId);
        }
      }
    }
  }

  // Support for Pause/Resume/Stop
  static pause() {
    console.log('[RoboticsAgent] Execution pause requested (not implemented for remote sim).');
  }

  static resume() {
    console.log('[RoboticsAgent] Execution resume requested (not implemented for remote sim).');
  }

  static stop() {
    for (const arm of this.armPool.values()) {
      arm.busy = false;
      arm.missionId = null;
    }
    this.missionQueue = [];
    this.missionContexts.clear();
    console.log('[RoboticsAgent] Execution stopped and queue cleared.');
  }

  static async handleExternalCompletion(missionId: string, armId: string, snapshots?: { workspaceImage?: string | null; boxImage?: string | null }) {
    console.log(`[RoboticsAgent] External completion received for mission ${missionId} on arm ${armId}`);
    const context = this.missionContexts.get(missionId);
    if (context) {
      const mission = missionStore.getMission(missionId);
      const expectedItems = mission?.data.recommendation?.items ?? [];
      const roboticsVision = mission?.data.roboticsVision
        ?? await analyzeRoboticsWorkspace({
          workspaceImage: snapshots?.workspaceImage,
          expectedItems
        });

      if (mission && !mission.data.roboticsVision) {
        mission.data.roboticsVision = {
          ...roboticsVision,
          lastAnalyzedAt: Date.now()
        };
        missionStore.setMission(missionId, mission);
      }

      if (roboticsVision?.summary) {
        context.agent.sendMessage(AgentType.COORDINATOR, createEvent(
          missionId,
          AgentType.ROBOTICS,
          MissionEventType.AGENT_THINKING,
          {
            message: roboticsVision.summary
          },
          {
            rationale: `${roboticsVision.model} analyzed the top-down robotic workspace once before verification.`
          }
        ));
      }

      const verification = await verifyBoxWithLoopAgent({
        workspaceImage: snapshots?.workspaceImage,
        boxImage: snapshots?.boxImage,
        expectedItems
      });

      verification.attempts.forEach((attempt: any) => {
        context.agent.sendMessage(AgentType.COORDINATOR, createEvent(
          missionId,
          AgentType.ROBOTICS,
          MissionEventType.AGENT_THINKING,
          {
            message: `LoopAgent iteration ${attempt.iteration}: ${attempt.summary}`
          },
          {
            rationale: `${verification.workflow} evaluated the overhead brown-box camera feed for completed kit presence.`
          }
        ));
      });

      this.complete(missionId, armId, context, verification);
      this.missionContexts.delete(missionId);
    } else {
      console.error(`[RoboticsAgent] Cannot complete mission ${missionId}: context is missing.`);
    }
  }
}

export const roboticsTool = new Tool({
  name: 'execute',
  description: 'Executes robotic pick-and-place sequence in MuJoCo simulation.',
  inputSchema: RoboticsInputSchema,
  outputSchema: RoboticsOutputSchema,
  run: async ({ missionId, pickSequence }, context) => {
    await RoboticsAgent.execute(missionId, pickSequence, context);
    return { success: true };
  }
});

export const roboticsAgent = new Agent({
  name: AgentType.ROBOTICS,
  description: 'Executes robotic assembly tasks using MuJoCo simulation.',
  tools: [roboticsTool]
});
