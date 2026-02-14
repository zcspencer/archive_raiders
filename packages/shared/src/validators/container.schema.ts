import { z } from "zod";
import { currencyRewardSchema } from "./currency.schema.js";

/**
 * Runtime validator for container kind.
 */
export const containerKindSchema = z.enum([
  "chest",
  "crate",
  "bag",
  "bookshelf",
  "cabinet"
]);

/**
 * Runtime validator for a loot entry in a container definition.
 */
export const lootEntrySchema = z.object({
  definitionId: z.string().min(1),
  quantity: z.number().int().positive(),
  weight: z.number().positive().optional()
});

/**
 * Runtime validator for container definition from content JSON.
 */
export const containerDefinitionSchema = z.object({
  id: z.string().min(1),
  kind: containerKindSchema,
  loot: z.array(lootEntrySchema),
  currencyRewards: z.array(currencyRewardSchema)
});

/**
 * Runtime validator for open-container payload.
 */
export const openContainerPayloadSchema = z.object({
  objectId: z.string().min(1)
});

/**
 * Runtime validator for claim-container payload.
 */
export const claimContainerPayloadSchema = z.object({
  objectId: z.string().min(1),
  nonce: z.string().min(1)
});
