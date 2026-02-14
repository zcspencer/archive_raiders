import type { ItemAction } from "@odyssey/shared";
import { z } from "zod";
import { equipmentSlotSchema } from "@odyssey/shared";
import { registerComponent } from "./ComponentRegistry.js";

const equippableParamsSchema = z.object({
  slot: equipmentSlotSchema,
  stats: z.record(z.number()).optional()
});

/**
 * Registers the Equippable component. Provides equip/unequip actions.
 * Stat modifiers applied in onEquip/onUnequip (no-op for now; stats used by interaction/tool rules).
 */
function register(): void {
  registerComponent({
    typeId: "Equippable",
    paramsSchema: equippableParamsSchema,
    getActions: (): ItemAction[] => ["equip", "unequip"],
    onEquip: (): void => {
      // Stat modifiers would be applied here; tool rules read from equipment + definition
    },
    onUnequip: (): void => {
      // Stat modifiers removed
    }
  });
}

register();
