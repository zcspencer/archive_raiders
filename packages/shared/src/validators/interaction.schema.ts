import { z } from "zod";

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
 * Runtime validator for map context payload.
 */
export const setMapPayloadSchema = z.object({
  mapKey: z.string().min(1).max(128)
});

/**
 * Runtime validator for attack target payload (client -> server).
 */
export const attackTargetPayloadSchema = tileCoordinateSchema;
