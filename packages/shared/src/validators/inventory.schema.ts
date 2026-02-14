import { z } from "zod";
import { toolIdSchema, toolUpgradeLevelSchema } from "./tool.schema.js";

/**
 * Runtime validator for inventory stacks.
 */
export const inventoryStackSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().positive()
});

/**
 * Runtime validator for authoritative tool state.
 */
export const playerToolStateSchema = z.object({
  toolId: toolIdSchema,
  upgradeLevel: toolUpgradeLevelSchema
});

/**
 * Runtime validator for hotbar slot values.
 */
export const hotbarSlotSchema = z.object({
  slotIndex: z.number().int().min(0).max(9),
  toolId: toolIdSchema.nullable()
});
