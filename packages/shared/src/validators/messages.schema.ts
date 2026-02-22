import { z } from "zod";

/**
 * Runtime validator for ObjectDamaged broadcast payload (server -> client).
 */
export const objectDamagedPayloadSchema = z.object({
  objectId: z.string().min(1),
  newHealth: z.number().int().nonnegative(),
  maxHealth: z.number().int().positive(),
  damage: z.number().int().nonnegative()
});

/**
 * Runtime validator for ObjectDestroyed broadcast payload (server -> client).
 */
export const objectDestroyedPayloadSchema = z.object({
  objectId: z.string().min(1)
});

/**
 * Runtime validator for ClaimTaskLoot message payload (client -> server).
 */
export const claimTaskLootPayloadSchema = z.object({
  taskId: z.string().min(1)
});
