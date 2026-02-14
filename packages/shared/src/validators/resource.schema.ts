import { z } from "zod";

/**
 * Runtime validator for player stamina state.
 */
export const playerResourceStateSchema = z.object({
  stamina: z.number().int().nonnegative(),
  maxStamina: z.number().int().positive()
});
