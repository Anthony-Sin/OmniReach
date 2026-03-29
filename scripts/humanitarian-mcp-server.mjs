import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new McpServer({
  name: 'aegis-humanitarian-mcp',
  version: '1.0.0'
});

server.registerTool(
  'humanitarian_brief',
  {
    title: 'Humanitarian Brief',
    description: 'Build a lightweight humanitarian and disaster operations brief for a target zone.',
    inputSchema: {
      zoneName: z.string(),
      disasterType: z.string().optional(),
      severity: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional()
    }
  },
  async ({ zoneName, disasterType, severity, lat, lng }) => {
    const lines = [
      `Zone: ${zoneName}`,
      `Disaster Type: ${disasterType || 'multi-hazard'}`,
      `Severity: ${severity || 'unknown'}`,
      typeof lat === 'number' && typeof lng === 'number'
        ? `Coordinates: ${lat.toFixed(2)}, ${lng.toFixed(2)}`
        : 'Coordinates: not provided',
      'Operational Lens: prioritize search-and-rescue, hydration, first-aid, and last-mile access checks.',
      'Data Sources: humanitarian MCP signal, mission inventory state, and live zone telemetry.'
    ].join('\n');

    return {
      content: [{ type: 'text', text: lines }],
      structuredContent: {
        zoneName,
        disasterType: disasterType || 'multi-hazard',
        severity: severity || 'unknown',
        coordinates: typeof lat === 'number' && typeof lng === 'number' ? { lat, lng } : null
      }
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
