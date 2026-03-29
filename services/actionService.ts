import fs from 'fs/promises';
import path from 'path';
import { MissionCompletePayload, MissionState } from '../src/types/mission';

interface IncidentPacketInput {
  mission: MissionState;
  completion: MissionCompletePayload;
}

export interface IncidentExportResult {
  exportPath: string;
  partnerName: string;
  channels: string[];
}

export interface WebhookDispatchResult {
  targetUrl: string;
  deliveryStatus: 'DELIVERED' | 'SKIPPED';
  partnerName: string;
  responseCode?: number;
}

const getPartnerName = () => process.env.AEGIS_PARTNER_NAME || 'Local Emergency Operations';
const getOutboxDir = () => process.env.AEGIS_OUTBOX_DIR || path.join(process.cwd(), 'outbox', 'incidents');

export async function exportIncidentPacket({ mission, completion }: IncidentPacketInput): Promise<IncidentExportResult> {
  const partnerName = getPartnerName();
  const outboxDir = getOutboxDir();
  await fs.mkdir(outboxDir, { recursive: true });

  const exportPath = path.join(outboxDir, `${mission.id}.json`);
  const packet = {
    missionId: mission.id,
    partnerName,
    exportedAt: new Date().toISOString(),
    zone: mission.data.selectedZone,
    recommendation: mission.data.recommendation,
    route: mission.data.route,
    transportMode: mission.data.transportMode,
    completion,
    events: mission.events
  };

  await fs.writeFile(exportPath, JSON.stringify(packet, null, 2), 'utf8');
  return {
    exportPath,
    partnerName,
    channels: ['INCIDENT_EXPORT']
  };
}

export async function dispatchPartnerWebhook({ mission, completion }: IncidentPacketInput): Promise<WebhookDispatchResult> {
  const targetUrl = process.env.AEGIS_WEBHOOK_URL;
  const partnerName = getPartnerName();

  if (!targetUrl) {
    return {
      targetUrl: 'not-configured',
      deliveryStatus: 'SKIPPED',
      partnerName
    };
  }

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      missionId: mission.id,
      partnerName,
      zone: mission.data.selectedZone,
      recommendation: mission.data.recommendation,
      route: mission.data.route,
      completion
    })
  });

  if (!response.ok) {
    throw new Error(`Partner webhook failed with status ${response.status}`);
  }

  return {
    targetUrl,
    deliveryStatus: 'DELIVERED',
    partnerName,
    responseCode: response.status
  };
}
