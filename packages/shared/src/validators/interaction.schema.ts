import { z } from "zod";
import { toolActionTypeSchema, toolIdSchema } from "./tool.schema.js";

/**
 * Runtime validator for world tile coordinates.
 */
export const tileCoordinateSchema = z.object({
  gridX: z.number().int().nonnegative().max(65535),
  gridY: z.number().int().nonnegative().max(65535)
});

/**
 * Runtime validator for client movement payload.
 */
export const movePayloadSchema = tileCoordinateSchema;

/**
 * Runtime validator for interaction payload.
 */
export const interactPayloadSchema = z.object({
  target: tileCoordinateSchema,
  toolId: toolIdSchema,
  actionType: toolActionTypeSchema,
  chargeMs: z.number().int().nonnegative().max(4000)
});

/**
 * Runtime validator for hotbar select payload.
 */
export const hotbarSelectPayloadSchema = z.object({
  slotIndex: z.number().int().min(0).max(9)
});
