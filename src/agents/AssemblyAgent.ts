
import { Agent, Tool } from '../lib/adk';
import { getKitRecommendation } from '../../services/geminiService';
import { createEvent } from '../lib/agentUtils';
import { MissionEventType, KitPlanCreatedPayloadSchema, KitSpecialization, AgentType } from '../types/mission';
import { allItems } from '../assets/items/index';
import { AssemblyInputSchema, AssemblyOutputSchema } from '../types/adk';

const VALID_ITEM_NAMES = new Set(
  allItems.map(item => item.name.toLowerCase().trim().replace(/\s+/g, '_'))
);

export class AssemblyAgent {
  static async planKit(missionId: string, zone: any, context: any, specialization?: KitSpecialization, constraints?: string) {
    try {
      // 1. Emit thinking status
      const thinkingEvent = createEvent(
        missionId,
        AgentType.ASSEMBLY,
        MissionEventType.AGENT_THINKING,
        { message: `Designing specialized kit for ${zone.name}...` },
        { rationale: 'Consulting disaster response database for optimal resource allocation.' }
      );
      context.agent.sendMessage(AgentType.COORDINATOR, thinkingEvent);

      // getKitRecommendation now handles retries and validation internally
      const recommendation = await getKitRecommendation(zone, specialization, constraints);

      // Normalize and validate items against catalog
      const items = recommendation.items || [];
      const validatedItems: string[] = [];
      const missingItems: string[] = recommendation.missingItems || [];

      items.forEach((itemName: string) => {
        const normalizedName = itemName.toLowerCase().trim().replace(/\s+/g, '_');
        if (VALID_ITEM_NAMES.has(normalizedName)) {
          validatedItems.push(normalizedName);
        } else {
          missingItems.push(itemName);
        }
      });

      // Ensure at least some items are present, otherwise fallback
      if (validatedItems.length === 0) {
        console.warn('No valid items found in AI recommendation, using fallback kit.');
        validatedItems.push('first_aid_kit', 'water_bottle_500ml', 'emergency_blanket');
        missingItems.push(...items);
      }

      // Filter assembly order to only include validated items
      const assemblyOrder = (recommendation.assemblyOrder || [])
        .map((name: string) => name.toLowerCase().trim().replace(/\s+/g, '_'))
        .filter((name: string) => validatedItems.includes(name));

      // If assembly order is empty but we have items, just use the items list
      const finalAssemblyOrder = assemblyOrder.length > 0 ? assemblyOrder : validatedItems;

      const payload = { 
        kitType: recommendation.kitType,
        items: validatedItems,
        assemblyOrder: finalAssemblyOrder,
        missingItems: missingItems,
        priority: recommendation.priority || 'medium',
        reasoning: recommendation.reasoning || 'Optimized kit for disaster type.',
        requiredResources: recommendation.requiredResources || ['Standard Assembly Line', 'Logistics Drone'],
        waypoints: recommendation.waypoints
      };

      // Final schema validation
      KitPlanCreatedPayloadSchema.parse(payload);

      const planEvent = createEvent(
        missionId,
        AgentType.ASSEMBLY,
        MissionEventType.KIT_PLAN_CREATED,
        payload,
        { rationale: recommendation.reasoning || 'Designing a specialized response kit based on disaster parameters.' }
      );
      context.agent.sendMessage(AgentType.COORDINATOR, planEvent);

    } catch (error: any) {
      console.error('AssemblyAgent Error:', error);
      const failEvent = createEvent(
        missionId,
        AgentType.ASSEMBLY,
        MissionEventType.MISSION_FAILED,
        { 
          reason: 'AI reasoning failure or validation error during kit planning.',
          failedAgent: AgentType.ASSEMBLY,
          errors: [error.message],
          canRetry: false
        },
        { 
          status: 'ERROR',
          errors: [error.message],
          rationale: 'AI reasoning failure or validation error during kit planning.'
        }
      );
      context.agent.sendMessage(AgentType.COORDINATOR, failEvent);
    }
  }
}

export const assemblyTool = new Tool({
  name: 'planKit',
  description: 'Plans a relief kit based on zone requirements and specialization.',
  inputSchema: AssemblyInputSchema,
  outputSchema: AssemblyOutputSchema,
  run: async ({ missionId, zone, specialization, constraints }, context) => {
    await AssemblyAgent.planKit(missionId, zone, context, specialization, constraints);
    return { success: true };
  }
});

export const assemblyAgent = new Agent({
  name: AgentType.ASSEMBLY,
  description: 'Plans kits based on zone, specialization, and constraints.',
  tools: [assemblyTool]
});
