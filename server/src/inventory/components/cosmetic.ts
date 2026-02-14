import type { ItemAction } from "@odyssey/shared";
import { z } from "zod";
import { equipmentSlotSchema } from "@odyssey/shared";
import { registerComponent } from "./ComponentRegistry.js";

const cosmeticParamsSchema = z.object({
  slot: equipmentSlotSchema,
  spriteOverrides: z.record(z.string()).optional()
});

/**
 * Registers the Cosmetic component. Purely visual; provides equip/unequip actions, no stat effects.
 */
function register(): void {
  registerComponent({
    typeId: "Cosmetic",
    paramsSchema: cosmeticParamsSchema,
    getActions: (): ItemAction[] => ["equip", "unequip"]
  });
}

register();
