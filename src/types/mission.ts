
import { z } from 'zod';

export enum AgentType {
  SENTINEL = 'SENTINEL',
  INTEL = 'INTEL',
  TRIAGE = 'TRIAGE',
  ASSEMBLY = 'ASSEMBLY',
  LOGISTICS = 'LOGISTICS',
  ROBOTICS = 'ROBOTICS',
  DELIVERY = 'DELIVERY',
  ACTION = 'ACTION',
  COORDINATOR = 'COORDINATOR',
  INVENTORY = 'INVENTORY',
}

export enum MissionProgress {
  IDLE = 'IDLE',
  MONITORING = 'MONITORING',
  TRIAGING = 'TRIAGING',
  PLANNING = 'PLANNING',
  SEQUENCING = 'SEQUENCING',
  EXECUTING = 'EXECUTING',
  DELIVERING = 'DELIVERING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
  QUEUED = 'QUEUED',
  TRIAGE_QUEUED = 'TRIAGE_QUEUED'
}

export type MissionStatus = 'SUCCESS' | 'ERROR' | 'RETRYING' | 'PENDING';

export enum KitSpecialization {
  MEDICAL = 'MEDICAL',         // injured individuals, trauma care
  FAMILY_SHELTER = 'FAMILY_SHELTER',  // families, children, elderly
  WATER_SANITATION = 'WATER_SANITATION', // crowd hydration, hygiene
  SEARCH_RESCUE = 'SEARCH_RESCUE',   // trapped persons, extraction tools
}

export enum MissionPriority {
  CRITICAL = 0,   // SEARCH_RESCUE, active trauma
  HIGH = 1,       // MEDICAL
  STANDARD = 2,   // FAMILY_SHELTER, WATER_SANITATION
}

export const ZoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['flood', 'earthquake', 'conflict', 'wildfire', 'facility', 'cyclone', 'volcano', 'drought']),
  severity: z.enum(['low', 'medium', 'high', 'critical', 'nominal']),
  lat: z.number(),
  lng: z.number(),
  radius: z.number().optional(),
  description: z.string().optional(),
  alertLevel: z.string().optional(),
  waypoints: z.array(z.tuple([z.number(), z.number(), z.number()])).optional(),
  intelSummary: z.string().optional(),
  reliefWebCount: z.number().optional(),
  floodGaugeCount: z.number().optional(),
  floodRiskScore: z.number().optional(),
});

export type Zone = z.infer<typeof ZoneSchema>;

export interface MissionQueueEntry {
  missionId: string;
  priority: MissionPriority;
  specialization: KitSpecialization;
  zone: Zone;
  enqueuedAt: number;
}

export enum MissionEventType {
  ALERT_DETECTED = 'ALERT_DETECTED',
  ZONE_PRIORITIZED = 'ZONE_PRIORITIZED',
  KIT_PLAN_CREATED = 'KIT_PLAN_CREATED',
  PICK_SEQUENCE_CREATED = 'PICK_SEQUENCE_CREATED',
  ARM_EXECUTION_STARTED = 'ARM_EXECUTION_STARTED',
  ARM_EXECUTION_COMPLETED = 'ARM_EXECUTION_COMPLETED',
  DELIVERY_ROUTE_CREATED = 'DELIVERY_ROUTE_CREATED',
  DELIVERY_DISPATCHED = 'DELIVERY_DISPATCHED',
  DELIVERY_WAYPOINT_REACHED = 'DELIVERY_WAYPOINT_REACHED',
  DELIVERY_ARRIVED = 'DELIVERY_ARRIVED',
  INCIDENT_EXPORT_CREATED = 'INCIDENT_EXPORT_CREATED',
  PARTNER_WEBHOOK_DISPATCHED = 'PARTNER_WEBHOOK_DISPATCHED',
  ACTION_HANDOFF_COMPLETED = 'ACTION_HANDOFF_COMPLETED',
  AUTO_DEPLOY_TRIGGERED = 'AUTO_DEPLOY_TRIGGERED',
  MISSION_COMPLETE = 'MISSION_COMPLETE',
  MISSION_FAILED = 'MISSION_FAILED',
  MISSION_RETRYING = 'MISSION_RETRYING',
  DELIVERY_DELAYED_WEATHER = 'DELIVERY_DELAYED_WEATHER',
  AGENT_THINKING = 'AGENT_THINKING',
  AGENT_WAITING = 'AGENT_WAITING',
  ROBOT_ARM_STATUS = 'ROBOT_ARM_STATUS'
}

export enum AgentRequestType {
  QUERY_ACTIVE_ZONES    = 'QUERY_ACTIVE_ZONES',    // Is this zone already being handled?
  QUERY_INVENTORY       = 'QUERY_INVENTORY',        // Is this item available?
  CLAIM_INVENTORY_ITEM  = 'CLAIM_INVENTORY_ITEM',   // Reserve this item for my mission
  RELEASE_INVENTORY     = 'RELEASE_INVENTORY',      // I no longer need this item
}

export interface AgentRequestEvent {
  requestId: string;
  targetAgent: AgentType;
  requestType: AgentRequestType;
  payload: Record<string, any>;
  timestamp: number;
}

// Payload Definitions
export const NormalizedAlertSchema = z.object({
  id: z.string(),
  eventid: z.number(),
  episodeid: z.number(),
  type: z.string(),
  name: z.string(),
  country: z.string(),
  lat: z.number(),
  lng: z.number(),
  alertLevel: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string(),
  timestamp: z.string(),
});

export type NormalizedAlert = z.infer<typeof NormalizedAlertSchema>;

export const AlertDetectedPayloadSchema = z.object({
  alerts: z.array(NormalizedAlertSchema),
  summary: z.string(),
  count: z.number(),
  evidence: z.object({
    source: z.string(),
    lastSnapshotId: z.string().optional(),
  }).optional(),
});

export type AlertDetectedPayload = z.infer<typeof AlertDetectedPayloadSchema>;

export const ZonePrioritizedPayloadSchema = z.object({
  zone: ZoneSchema,
  ranked: z.array(ZoneSchema),
  priorityScore: z.number(),
  reason: z.string(),
  constraints: z.array(z.string()),
  recommendedMissionMode: z.enum(['EMERGENCY', 'STANDARD', 'MONITORING']),
});

export type ZonePrioritizedPayload = z.infer<typeof ZonePrioritizedPayloadSchema>;

export const KitPlanCreatedPayloadSchema = z.object({
  kitType: z.string(),
  items: z.array(z.string()),
  assemblyOrder: z.array(z.string()),
  missingItems: z.array(z.string()),
  reroutedItems: z.array(z.string()).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  reasoning: z.string(),
  requiredResources: z.array(z.string()),
  waypoints: z.array(z.tuple([z.number(), z.number(), z.number()])).optional(),
});

export type KitPlanCreatedPayload = z.infer<typeof KitPlanCreatedPayloadSchema>;

export const PickStepSchema = z.object({
  id: z.string(),
  action: z.enum(['PICK', 'STAGE', 'HANDOFF', 'RETURN', 'FALLBACK']),
  item: z.string(),
  source: z.array(z.number()), // [x, y, z]
  target: z.array(z.number()), // [x, y, z]
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  expectedDuration: z.number(), // seconds
  safetyChecks: z.array(z.string()),
});

export type PickStep = z.infer<typeof PickStepSchema>;

export const PickSequenceCreatedPayloadSchema = z.object({
  steps: z.array(PickStepSchema),
  estimatedTotalDuration: z.number(),
  safetyNotes: z.array(z.string()),
  warnings: z.array(z.string()).optional(),
});

export type PickSequenceCreatedPayload = z.infer<typeof PickSequenceCreatedPayloadSchema>;

export const ArmExecutionStartedPayloadSchema = z.object({
  plan: PickSequenceCreatedPayloadSchema,
  armId: z.string(),
  startPose: z.array(z.number()),
  targetPoses: z.array(z.array(z.number())),
  safetyChecks: z.array(z.string()),
  rollbackPlan: z.string(),
});

export type ArmExecutionStartedPayload = z.infer<typeof ArmExecutionStartedPayloadSchema>;

export const ArmExecutionCompletedPayloadSchema = z.object({
  success: z.boolean(),
  stepsCompleted: z.number(),
  totalSteps: z.number(),
  finalPose: z.array(z.number()),
  executionTime: z.number(),
  telemetry: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

export type ArmExecutionCompletedPayload = z.infer<typeof ArmExecutionCompletedPayloadSchema>;

export const DeliveryRouteCreatedPayloadSchema = z.object({
  waypoints: z.array(z.array(z.number())), // [lat, lng]
  fallbackWaypoints: z.array(z.array(z.number())).optional(),
  transportMode: z.enum(['DRONE', 'GROUND_ROBOT', 'AIR_DROP', 'GROUND_ROVER']),
  eta: z.number(), // seconds
  riskFlags: z.array(z.string()),
  routeNarrative: z.string(),
  constraints: z.array(z.string()).optional(),
  weatherRisk: z.number().optional(),
});

export type DeliveryRouteCreatedPayload = z.infer<typeof DeliveryRouteCreatedPayloadSchema>;

export const DeliveryTelemetryPayloadSchema = z.object({
  transportMode: z.enum(['DRONE', 'GROUND_ROBOT', 'AIR_DROP', 'GROUND_ROVER']),
  waypointIndex: z.number(),
  totalWaypoints: z.number(),
  currentLat: z.number(),
  currentLng: z.number(),
  targetLat: z.number(),
  targetLng: z.number(),
  etaSeconds: z.number(),
  percentComplete: z.number().min(0).max(100),
});

export type DeliveryTelemetryPayload = z.infer<typeof DeliveryTelemetryPayloadSchema>;

export const IncidentExportPayloadSchema = z.object({
  exportPath: z.string(),
  partnerName: z.string(),
  channels: z.array(z.string()),
});

export type IncidentExportPayload = z.infer<typeof IncidentExportPayloadSchema>;

export const PartnerWebhookPayloadSchema = z.object({
  targetUrl: z.string(),
  deliveryStatus: z.enum(['DELIVERED', 'SKIPPED']),
  partnerName: z.string(),
  responseCode: z.number().optional(),
});

export type PartnerWebhookPayload = z.infer<typeof PartnerWebhookPayloadSchema>;

export const ActionHandoffCompletedPayloadSchema = z.object({
  exportPath: z.string(),
  partnerName: z.string(),
  channelsUsed: z.array(z.string()),
  summary: z.string(),
});

export type ActionHandoffCompletedPayload = z.infer<typeof ActionHandoffCompletedPayloadSchema>;

export const MissionCompletePayloadSchema = z.object({
  summary: z.string(),
  timestamps: z.object({
    start: z.number(),
    end: z.number(),
  }),
  successMetrics: z.object({
    accuracy: z.number(),
    speed: z.number(),
    safety: z.number(),
  }),
});

export type MissionCompletePayload = z.infer<typeof MissionCompletePayloadSchema>;

export const MissionFailedPayloadSchema = z.object({
  reason: z.string(),
  failedAgent: z.string(),
  errors: z.array(z.string()).optional(),
  canRetry: z.boolean().optional(),
});

export type MissionFailedPayload = z.infer<typeof MissionFailedPayloadSchema>;

export interface MissionEvent<T = any> {
  missionId: string;
  traceId: string;
  sourceAgent: AgentType;
  targetAgent?: AgentType;
  timestamp: number;
  duration?: number; // Duration of the step in ms
  type: MissionEventType;
  confidence: number;
  status: MissionStatus;
  payload: T;
  rationale: string;
  errors?: string[];
  retryCount?: number;
}

export interface MissionState {
  id: string;
  progress: MissionProgress;
  currentStep: AgentType;
  events: MissionEvent[];
  data: {
    rawEvents?: NormalizedAlert[];
    rankedEvents?: Zone[];
    selectedZone?: Zone;
    recommendation?: KitPlanCreatedPayload;
    pickSequence?: PickStep[];
    executionStatus?: string;
    route?: DeliveryRouteCreatedPayload;
    startTime?: number;
    retryCount?: number;
    assignedArmId?: string;
    droneStatus?: 'IN_FLIGHT' | 'ARRIVED';
    transportMode?: 'DRONE' | 'GROUND_ROBOT' | 'AIR_DROP' | 'GROUND_ROVER';
    dronePosition?: { lat: number; lng: number };
    dronePercent?: number;
    exportPath?: string;
    partnerName?: string;
    actionChannels?: string[];
    kitSpecialization?: KitSpecialization;
  };
}
