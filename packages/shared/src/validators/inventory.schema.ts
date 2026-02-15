import { z } from "zod";
import type { ItemInstance } from "../types/inventory.js";
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

/**
 * Runtime validator for a recursive item instance tree.
 */
export const itemInstanceSchema: z.ZodType<ItemInstance> = z.lazy(() =>
  z.object({
    instanceId: z.string().min(1),
    definitionId: z.string().min(1),
    definitionVersion: z.number().int().positive(),
    quantity: z.number().int().positive(),
    containedItems: z.array(itemInstanceSchema).optional()
  })
);
