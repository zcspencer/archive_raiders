import { z } from "zod";

/**
 * Runtime validator for equipment slot identifiers.
 */
export const equipmentSlotSchema = z.enum(["hand", "head"]);
