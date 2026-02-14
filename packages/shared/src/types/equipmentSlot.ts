/**
 * Equipment slot identifiers. Extensible by adding values to the array.
 */
export const EQUIPMENT_SLOTS = ["hand", "head"] as const;

export type EquipmentSlot = (typeof EQUIPMENT_SLOTS)[number];
