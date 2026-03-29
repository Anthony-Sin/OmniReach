import { Agent, Tool } from '../lib/adk';
import { createEvent } from '../lib/agentUtils';
import { ActionInputSchema, ActionOutputSchema } from '../types/adk';
import {
  ActionHandoffCompletedPayloadSchema,
  AgentType,
  IncidentExportPayloadSchema,
  MissionCompletePayload,
  MissionEventType,
  PartnerWebhookPayloadSchema
} from '../types/mission';
import { exportIncidentPacket, dispatchPartnerWebhook } from '../../services/actionService';
import { missionStore } from '../lib/missionStore';

export class ActionAgent {
  static async handoff(missionId: string, completion: MissionCompletePayload, context: any) {
    const mission = missionStore.getMission(missionId);
    if (!mission) {
      throw new Error(`Mission ${missionId} not found for action handoff.`);
    }

    const exportResult = await exportIncidentPacket({ mission, completion });
    IncidentExportPayloadSchema.parse(exportResult);
    context.agent.sendMessage(AgentType.COORDINATOR, createEvent(
      missionId,
      AgentType.ACTION,
      MissionEventType.INCIDENT_EXPORT_CREATED,
      exportResult,
      { rationale: `Created incident export packet for ${exportResult.partnerName}.` }
    ));

    const webhookResult = await dispatchPartnerWebhook({ mission, completion });
    if (webhookResult.deliveryStatus === 'DELIVERED') {
      PartnerWebhookPayloadSchema.parse(webhookResult);
      context.agent.sendMessage(AgentType.COORDINATOR, createEvent(
        missionId,
        AgentType.ACTION,
        MissionEventType.PARTNER_WEBHOOK_DISPATCHED,
        webhookResult,
        { rationale: `Dispatched partner webhook to ${webhookResult.partnerName}.` }
      ));
    }

    const channelsUsed = [...exportResult.channels];
    if (webhookResult.deliveryStatus === 'DELIVERED') {
      channelsUsed.push('PARTNER_WEBHOOK');
    }

    const handoffPayload = {
      exportPath: exportResult.exportPath,
      partnerName: exportResult.partnerName,
      channelsUsed,
      summary: `Action handoff completed for ${exportResult.partnerName} using ${channelsUsed.join(', ')}.`
    };
    ActionHandoffCompletedPayloadSchema.parse(handoffPayload);
    context.agent.sendMessage(AgentType.COORDINATOR, createEvent(
      missionId,
      AgentType.ACTION,
      MissionEventType.ACTION_HANDOFF_COMPLETED,
      handoffPayload,
      { rationale: handoffPayload.summary }
    ));

    context.agent.sendMessage(AgentType.COORDINATOR, createEvent(
      missionId,
      AgentType.ACTION,
      MissionEventType.MISSION_COMPLETE,
      {
        summary: handoffPayload.summary,
        timestamps: { start: mission.data.startTime || Date.now(), end: Date.now() },
        successMetrics: { accuracy: 1, speed: 1, safety: 1 }
      },
      { rationale: handoffPayload.summary }
    ));
  }
}

export const actionTool = new Tool({
  name: 'handoff',
  description: 'Exports an incident packet and dispatches partner handoff actions.',
  inputSchema: ActionInputSchema,
  outputSchema: ActionOutputSchema,
  run: async ({ missionId, completion }, context) => {
    await ActionAgent.handoff(missionId, completion, context);
    return { success: true };
  }
});

export const actionAgent = new Agent({
  name: AgentType.ACTION,
  description: 'Performs outward operational handoffs such as incident exports and partner webhooks.',
  tools: [actionTool]
});
