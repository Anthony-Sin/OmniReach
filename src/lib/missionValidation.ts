
import { z } from 'zod';
import { MissionEventType, AgentType } from '../types/mission';

export const AlertDetectedSchema = z.object({
  alerts: z.array(z.object({
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
    timestamp: z.string()
  })),
  summary: z.string(),
  count: z.number(),
  evidence: z.object({
    source: z.string(),
    lastSnapshotId: z.string().optional()
  }).optional()
});

export const ZonePrioritizedSchema = z.object({
  zone: z.any(),
  ranked: z.array(z.any()),
  priorityScore: z.number().min(0).max(1),
  reason: z.string(),
  constraints: z.array(z.string()),
  recommendedMissionMode: z.enum(['EMERGENCY', 'STANDARD', 'MONITORING'])
});

export const KitPlanCreatedSchema = z.object({
  kitType: z.string(),
  items: z.array(z.string()),
  assemblyOrder: z.array(z.string()),
  missingItems: z.array(z.string()),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  reasoning: z.string(),
  requiredResources: z.array(z.string()),
  waypoints: z.array(z.array(z.number())).optional()
});

export const PickStepSchema = z.object({
  id: z.string(),
  action: z.enum(['PICK', 'STAGE', 'HANDOFF', 'RETURN', 'FALLBACK']),
  item: z.string(),
  source: z.array(z.number()).length(3),
  target: z.array(z.number()).length(3),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  expectedDuration: z.number(),
  safetyChecks: z.array(z.string())
});

export const PickSequenceCreatedSchema = z.object({
  steps: z.array(PickStepSchema),
  estimatedTotalDuration: z.number(),
  safetyNotes: z.array(z.string()),
  warnings: z.array(z.string()).optional()
});

export const ArmExecutionStartedSchema = z.object({
  plan: z.any(),
  startPose: z.array(z.number()),
  targetPoses: z.array(z.array(z.number())),
  safetyChecks: z.array(z.string()),
  rollbackPlan: z.string()
});

export const DeliveryRouteCreatedSchema = z.object({
  waypoints: z.array(z.array(z.number())),
  fallbackWaypoints: z.array(z.array(z.number())).optional(),
  transportMode: z.enum(['DRONE', 'GROUND_ROBOT', 'AIR_DROP']),
  eta: z.number(),
  riskFlags: z.array(z.string()),
  routeNarrative: z.string(),
  constraints: z.array(z.string()).optional()
});

export const MissionCompleteSchema = z.object({
  summary: z.string(),
  timestamps: z.object({
    start: z.number(),
    end: z.number()
  }),
  successMetrics: z.object({
    accuracy: z.number(),
    speed: z.number(),
    safety: z.number()
  })
});

export const MissionEventSchema = z.object({
  missionId: z.string(),
  traceId: z.string(),
  sourceAgent: z.string(), // AgentType
  targetAgent: z.string().optional(),
  timestamp: z.number(),
  type: z.nativeEnum(MissionEventType),
  confidence: z.number().min(0).max(1),
  status: z.string(), // MissionStatus
  payload: z.any(),
  rationale: z.string(),
  errors: z.array(z.string()).optional()
});

export function validateEventPayload(type: MissionEventType, payload: any) {
  switch (type) {
    case MissionEventType.ALERT_DETECTED:
      return AlertDetectedSchema.parse(payload);
    case MissionEventType.ZONE_PRIORITIZED:
      return ZonePrioritizedSchema.parse(payload);
    case MissionEventType.KIT_PLAN_CREATED:
      return KitPlanCreatedSchema.parse(payload);
    case MissionEventType.PICK_SEQUENCE_CREATED:
      return PickSequenceCreatedSchema.parse(payload);
    case MissionEventType.ARM_EXECUTION_STARTED:
      return ArmExecutionStartedSchema.parse(payload);
    case MissionEventType.DELIVERY_ROUTE_CREATED:
      return DeliveryRouteCreatedSchema.parse(payload);
    case MissionEventType.MISSION_COMPLETE:
      return MissionCompleteSchema.parse(payload);
    default:
      return payload;
  }
}
