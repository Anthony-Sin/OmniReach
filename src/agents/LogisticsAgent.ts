
import { Agent, Tool } from '../lib/adk';
import { createEvent } from '../lib/agentUtils';
import { MissionEventType, KitPlanCreatedPayload, PickSequenceCreatedPayloadSchema, AgentType } from '../types/mission';
import { PickPlanner } from '../lib/pickPlanner';
import { explainLogisticsSequence } from '../../services/geminiService';
import { LogisticsInputSchema, LogisticsOutputSchema } from '../types/adk';

export class LogisticsAgent {
  static async createPickSequence(missionId: string, payload: KitPlanCreatedPayload, context: any) {
    try {
      // 1. Emit thinking status
      const thinkingEvent = createEvent(
        missionId,
        AgentType.LOGISTICS,
        MissionEventType.AGENT_THINKING,
        { message: 'Preparing a two-item robotic pick sequence for the arm workspace...' },
        { rationale: 'Condensing the kit into a compact robotic sequence that fits the physical scene.' }
      );
      context.agent.sendMessage(AgentType.COORDINATOR, thinkingEvent);

      // Generate deterministic pick sequence using the planner module.
      const { steps, warnings } = PickPlanner.generateSequence(payload);
      const totalDuration = PickPlanner.calculateTotalDuration(steps);

      // AI rationale for the sequence (handled in geminiService with retries)
      const aiRationale = await explainLogisticsSequence(payload.kitType, steps);

      // Safety notes based on kit priority
      const safetyNotes = [
        'Check arm clearance',
        'Verify workspace slot alignment',
        payload.priority === 'critical' ? 'EMERGENCY OVERRIDE ENABLED' : 'Standard safety protocols'
      ];

      const outPayload = { 
        steps,
        estimatedTotalDuration: totalDuration,
        safetyNotes,
        warnings
      };

      // Validate payload
      PickSequenceCreatedPayloadSchema.parse(outPayload);

      // 4. Emit the sequence
      const sequenceEvent = createEvent(
        missionId,
        AgentType.LOGISTICS,
        MissionEventType.PICK_SEQUENCE_CREATED,
        outPayload,
        { 
          status: 'SUCCESS',
          rationale: aiRationale
        }
      );
      context.agent.sendMessage(AgentType.COORDINATOR, sequenceEvent);

    } catch (error: any) {
      console.error('LogisticsAgent Error:', error);
      const failEvent = createEvent(
        missionId,
        AgentType.LOGISTICS,
        MissionEventType.MISSION_FAILED,
        { 
          reason: 'Failed to generate logistics sequence or validation failed.',
          failedAgent: AgentType.LOGISTICS,
          errors: [error.message],
          canRetry: true
        },
        { 
          status: 'ERROR',
          errors: [error.message],
          rationale: 'Failed to generate logistics sequence or validation failed.'
        }
      );
      context.agent.sendMessage(AgentType.COORDINATOR, failEvent);
    }
  }
}

export const logisticsTool = new Tool({
  name: 'createPickSequence',
  description: 'Creates an optimized pick sequence for a relief kit.',
  inputSchema: LogisticsInputSchema,
  outputSchema: LogisticsOutputSchema,
  run: async ({ missionId, recommendation }, context) => {
    await LogisticsAgent.createPickSequence(missionId, recommendation, context);
    return { success: true };
  }
});

export const logisticsAgent = new Agent({
  name: AgentType.LOGISTICS,
  description: 'Creates compact pick sequences for the robotic arm workspace.',
  tools: [logisticsTool]
});
