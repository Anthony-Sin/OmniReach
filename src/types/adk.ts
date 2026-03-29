
import { z } from 'zod';
import { KitSpecialization, MissionPriority, ZoneSchema, KitPlanCreatedPayloadSchema, PickSequenceCreatedPayloadSchema, DeliveryRouteCreatedPayloadSchema, MissionCompletePayloadSchema } from './mission';

export const MissionIdSchema = z.object({
  missionId: z.string()
});

export const SentinelInputSchema = MissionIdSchema;
export const SentinelOutputSchema = z.object({
  success: z.boolean()
});

export const IntelInputSchema = z.object({
  missionId: z.string(),
  alerts: z.array(z.any())
});
export const IntelOutputSchema = z.object({
  enrichedAlerts: z.array(z.any())
});

export const TriageInputSchema = z.object({
  missionId: z.string(),
  alerts: z.array(z.any())
});
export const TriageOutputSchema = z.object({
  success: z.boolean()
});

export const AssemblyInputSchema = z.object({
  missionId: z.string(),
  zone: ZoneSchema,
  specialization: z.nativeEnum(KitSpecialization).optional(),
  constraints: z.string().optional()
});
export const AssemblyOutputSchema = z.object({
  success: z.boolean()
});

export const LogisticsInputSchema = z.object({
  missionId: z.string(),
  recommendation: KitPlanCreatedPayloadSchema
});
export const LogisticsOutputSchema = z.object({
  success: z.boolean()
});

export const RoboticsInputSchema = z.object({
  missionId: z.string(),
  pickSequence: PickSequenceCreatedPayloadSchema
});
export const RoboticsOutputSchema = z.object({
  success: z.boolean()
});

export const DeliveryInputSchema = z.object({
  missionId: z.string(),
  start: z.object({ lat: z.number(), lng: z.number() }),
  end: ZoneSchema
});
export const DeliveryOutputSchema = z.object({
  success: z.boolean()
});

export const ActionInputSchema = z.object({
  missionId: z.string(),
  zone: ZoneSchema,
  recommendation: KitPlanCreatedPayloadSchema.optional(),
  route: DeliveryRouteCreatedPayloadSchema.optional(),
  completion: MissionCompletePayloadSchema,
});
export const ActionOutputSchema = z.object({
  success: z.boolean()
});

export const CoordinatorInputSchema = z.object({
  zone: ZoneSchema.optional()
});
export const CoordinatorOutputSchema = z.object({
  success: z.boolean(),
  missionId: z.string()
});

export const CoordinatorQueryActiveZonesInputSchema = z.object({
  requestingMissionId: z.string().optional()
});

export const CoordinatorQueryActiveZonesOutputSchema = z.object({
  activeZoneIds: z.array(z.string().optional())
});
