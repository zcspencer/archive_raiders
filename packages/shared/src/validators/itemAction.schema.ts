import { z } from "zod";
import { equipmentSlotSchema } from "./equipmentSlot.schema.js";

/**
 * Runtime validator for item action type.
 */
export const itemActionSchema = z.enum([
  "drop",
  "equip",
  "unequip",
  "use",
  "read",
  "open"
]);

/**
 * Runtime validator for item action request payload.
 */
export const itemActionRequestSchema = z.object({
  instanceId: z.string().min(1),
  action: itemActionSchema
});

/** Payload for ClientMessage.EquipItem: equip by inventory instance ID. */
export const equipItemPayloadSchema = z.object({
  instanceId: z.string().min(1)
});

/** Payload for ClientMessage.UnequipItem: unequip by slot. */
export const unequipItemPayloadSchema = z.object({
  slot: equipmentSlotSchema
});

/** Payload for ClientMessage.DropItem: destroy item by instance ID. */
export const dropItemPayloadSchema = z.object({
  instanceId: z.string().min(1)
});
