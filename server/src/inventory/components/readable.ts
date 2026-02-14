import type { ItemAction } from "@odyssey/shared";
import { z } from "zod";
import { registerComponent } from "./ComponentRegistry.js";

const readableParamsSchema = z.object({
  contentType: z.enum(["text", "image", "render"]),
  content: z.string()
});

/**
 * Registers the Readable component. Provides read action; server-side onUse is a no-op (client presents content).
 */
function register(): void {
  registerComponent({
    typeId: "Readable",
    paramsSchema: readableParamsSchema,
    getActions: (): ItemAction[] => ["read"]
  });
}

register();
