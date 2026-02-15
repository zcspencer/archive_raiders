import { z } from "zod";
import { currencyRewardSchema } from "./currency.schema.js";
import { lootDropSchema } from "./lootTable.schema.js";

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
 * Exactly one of `loot` or `drops` must be present.
 */
export const containerDefinitionSchema = z
  .object({
    id: z.string().min(1),
    kind: containerKindSchema,
    loot: z.array(lootEntrySchema).optional(),
    drops: z.array(lootDropSchema).min(1).optional(),
    currencyRewards: z.array(currencyRewardSchema)
  })
  .refine(
    (d) => (d.loot !== undefined) !== (d.drops !== undefined),
    { message: "Exactly one of 'loot' or 'drops' must be provided" }
  );

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
