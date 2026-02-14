import { z } from "zod";

/**
 * Runtime validator for supported tool ids.
 */
export const toolIdSchema = z.enum(["axe", "watering_can", "seeds"]);

/**
 * Runtime validator for tool action channels.
 */
export const toolActionTypeSchema = z.enum(["primary", "secondary"]);

/**
 * Runtime validator for tool upgrade levels.
 */
export const toolUpgradeLevelSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4)
]);
