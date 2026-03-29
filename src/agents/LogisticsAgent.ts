
import { Agent, Tool } from '../lib/adk';
import { createEvent } from '../lib/agentUtils';
import { MissionEventType, KitPlanCreatedPayload, PickSequenceCreatedPayloadSchema, AgentType } from '../types/mission';
import { PickPlanner } from '../lib/pickPlanner';
import { explainLogisticsSequence } from '../../services/geminiService';
import { LogisticsInputSchema, LogisticsOutputSchema } from '../types/adk';
import { inventoryAgent } from './InventoryAgent';

export class LogisticsAgent {
  static async createPickSequence(missionId: string, payload: KitPlanCreatedPayload, context: any) {
    try {
      // 1. Emit thinking status
      const thinkingEvent = createEvent(
        missionId,
        AgentType.LOGISTICS,
        MissionEventType.AGENT_THINKING,
        { message: 'Verifying inventory availability (Check-then-Commit)...' },
        { rationale: 'Validating resource availability before finalizing the logistics plan.' }
      );
      context.agent.sendMessage(AgentType.COORDINATOR, thinkingEvent);

      // 0. Check stock before claiming
      const stockCheck = await context.agent.runTool('checkStock', { items: payload.items }, { targetAgent: AgentType.INVENTORY });
      
      if (!payload.reroutedItems) payload.reroutedItems = [];

      if (stockCheck.missingItems.length > 0) {
        for (const missingItem of stockCheck.missingItems) {
          // Logic: If critical, try to reroute. Otherwise, reduce allocation.
          if (payload.priority === 'critical') {
            console.log(`[Logistics] Decision: Rerouted to Warehouse_B due to supply shortage of ${missingItem}.`);
            payload.reroutedItems.push(missingItem);
            // Simulate rerouting delay
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            console.log(`[Logistics] Decision: Reduced allocation due to supply shortage of ${missingItem}.`);
          }
        }
      }

      // 1. Claim items from InventoryAgent
      const itemsToClaim = [...payload.items];
      payload.items = [];
      if (!payload.missingItems) payload.missingItems = [];

      for (const itemName of itemsToClaim) {
        try {
          // ADK: Use InventoryAgent tool via context
          const result = await context.agent.runTool('claim', { item: itemName, missionId }, { targetAgent: AgentType.INVENTORY });

          if (result.success) {
            payload.items.push(itemName);
          } else {
            console.warn(`[Logistics] Item ${itemName} already claimed by ${result.claimedBy}`);
            payload.missingItems.push(itemName);
          }
        } catch (e) {
          console.error(`[Logistics] Failed to claim item ${itemName}:`, e);
          payload.missingItems.push(itemName);
        }
      }

      // 1. Generate deterministic pick sequence using the planner module
      const { steps, warnings } = PickPlanner.generateSequence(payload);
      const totalDuration = PickPlanner.calculateTotalDuration(steps);

      // 2. AI Rationale for the sequence (handled in geminiService with retries)
      const aiRationale = await explainLogisticsSequence(payload.kitType, steps);

      // 3. Safety notes based on kit priority
      const safetyNotes = [
        'Check arm clearance',
        'Verify item weight',
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
  description: 'Creates pick sequences and claims inventory.',
  tools: [logisticsTool]
});
