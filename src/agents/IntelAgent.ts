import { Agent, Tool } from '../lib/adk';
import { AgentType } from '../types/mission';
import { IntelInputSchema, IntelOutputSchema } from '../types/adk';
import { fetchReliefWebContext } from '../../services/reliefWebService';
import { fetchUsgsFloodContext } from '../../services/usgsFloodService';

export class IntelAgent {
  static async enrichAlerts(alerts: any[]) {
    const enrichedAlerts = await Promise.all(alerts.map(async (alert) => {
      const [reliefWeb, flood] = await Promise.all([
        fetchReliefWebContext(alert),
        fetchUsgsFloodContext(alert)
      ]);

      return {
        ...alert,
        reliefWebCount: reliefWeb.count,
        floodGaugeCount: flood.count,
        floodRiskScore: flood.floodRiskScore,
        intelSummary: [reliefWeb.summary, flood.summary].filter(Boolean).join(' ')
      };
    }));

    return { enrichedAlerts };
  }
}

export const intelTool = new Tool({
  name: 'enrichAlerts',
  description: 'Enriches alerts with ReliefWeb humanitarian context and USGS flood observations.',
  inputSchema: IntelInputSchema,
  outputSchema: IntelOutputSchema,
  run: async ({ alerts }) => IntelAgent.enrichAlerts(alerts)
});

export const intelAgent = new Agent({
  name: AgentType.INTEL,
  description: 'Enriches disaster alerts with external humanitarian and flood context.',
  tools: [intelTool]
});
