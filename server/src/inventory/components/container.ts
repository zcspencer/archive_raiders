import type { ItemAction } from "@odyssey/shared";
import { z } from "zod";
import { registerComponent } from "./ComponentRegistry.js";

const containerParamsSchema = z.object({
  maxSlots: z.number().int().positive(),
  allowedDefinitionIds: z.array(z.string()).optional(),
  allowedComponentTypes: z.array(z.string()).optional()
});

/**
 * Registers the Container component for bagged items (e.g. backpack).
 * Provides open, extract, insert actions. World containers use ContainerService, not this.
 */
function register(): void {
  registerComponent({
    typeId: "Container",
    paramsSchema: containerParamsSchema,
    getActions: (): ItemAction[] => ["open"]
    // extract/insert are separate action types if we add them to ItemAction; for now "open" suffices
  });
}

register();
