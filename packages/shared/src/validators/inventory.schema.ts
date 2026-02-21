import { z } from "zod";
import type { ItemInstance } from "../types/inventory.js";

/**
 * Runtime validator for inventory stacks.
 */
export const inventoryStackSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().positive()
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
