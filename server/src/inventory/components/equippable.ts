import type { ItemAction } from "@odyssey/shared";
import { z } from "zod";
import { equipmentSlotSchema } from "@odyssey/shared";
import { registerComponent } from "./ComponentRegistry.js";

const equippableParamsSchema = z.object({
  slot: equipmentSlotSchema,
  baseDamage: z.number().nonnegative().default(0),
  tagModifiers: z.record(z.number().positive()).optional(),
  rate: z.number().positive().default(1),
  range: z.number().int().positive().default(1)
});

/**
 * Registers the Equippable component. Provides equip/unequip actions.
 */
function register(): void {
  registerComponent({
    typeId: "Equippable",
    paramsSchema: equippableParamsSchema,
    getActions: (): ItemAction[] => ["equip", "unequip"],
    onEquip: (): void => {},
    onUnequip: (): void => {}
  });
}

register();
