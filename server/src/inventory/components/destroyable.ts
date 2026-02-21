import type { ItemAction } from "@odyssey/shared";
import { z } from "zod";
import { lootDropSchema } from "@odyssey/shared";
import { registerComponent } from "./ComponentRegistry.js";

const destroyableParamsSchema = z.object({
  health: z.number().int().positive(),
  drops: z.array(lootDropSchema).optional()
});

/**
 * Registers the Destroyable component. Items with this component can be placed as world objects
 * and damaged until destroyed; drops are resolved for the player who deals the killing blow.
 */
function register(): void {
  registerComponent({
    typeId: "Destroyable",
    paramsSchema: destroyableParamsSchema,
    getActions: (): ItemAction[] => []
  });
}

register();
