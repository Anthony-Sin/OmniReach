
import { z } from 'zod';
import { KitSpecialization, MissionPriority, ZoneSchema, KitPlanCreatedPayloadSchema, PickSequenceCreatedPayloadSchema } from './mission';

export const MissionIdSchema = z.object({
  missionId: z.string()
});

export const SentinelInputSchema = MissionIdSchema;
export const SentinelOutputSchema = z.object({
  success: z.boolean()
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

export const InventoryClaimInputSchema = z.object({
  item: z.string(),
  missionId: z.string()
});
export const InventoryClaimOutputSchema = z.object({
  success: z.boolean(),
  claimedBy: z.string().optional()
});

export const InventoryReleaseInputSchema = z.object({
  item: z.string(),
  missionId: z.string()
});
export const InventoryReleaseOutputSchema = z.object({
  success: z.boolean()
});

export const InventoryQueryInputSchema = z.object({
  item: z.string()
});
export const InventoryQueryOutputSchema = z.object({
  available: z.boolean(),
  claimedBy: z.string().optional(),
  quantity: z.number().optional()
});

export const InventoryCheckStockInputSchema = z.object({
  items: z.array(z.string())
});
export const InventoryCheckStockOutputSchema = z.object({
  availableItems: z.array(z.string()),
  missingItems: z.array(z.string()),
  stockLevels: z.record(z.string(), z.number())
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
