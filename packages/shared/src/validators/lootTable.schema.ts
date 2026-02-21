import { z } from "zod";
import { itemRaritySchema } from "./itemDefinition.schema.js";

/** Quantity: either a positive integer or a { min, max } range. */
export const lootQuantitySchema = z.union([
  z.number().int().positive(),
  z
    .object({
      min: z.number().int().positive(),
      max: z.number().int().positive()
    })
    .refine((r) => r.max >= r.min, { message: "max must be >= min" })
]);

/** Item source. */
const itemSourceSchema = z.object({
  type: z.literal("item"),
  itemId: z.string().min(1),
  quantity: lootQuantitySchema
});

/** Table reference source. */
const tableSourceSchema = z.object({
  type: z.literal("table"),
  tableId: z.string().min(1)
});

/** Tag-based source: picks uniformly from items matching tag (and optional rarity). */
const tagSourceSchema = z.object({
  type: z.literal("tag"),
  tag: z.string().min(1),
  quantity: lootQuantitySchema,
  rarity: itemRaritySchema.optional()
});

/** Empty source: produces no loot. Useful for weighted pools with a chance of nothing. */
const nothingSourceSchema = z.object({
  type: z.literal("nothing")
});

/** Discriminated union of source types. */
export const lootSourceSchema = z.discriminatedUnion("type", [
  itemSourceSchema,
  tableSourceSchema,
  tagSourceSchema,
  nothingSourceSchema
]);

/** Source with a weight. */
export const weightedSourceSchema = z.object({
  weight: z.number().positive(),
  source: lootSourceSchema
});

/** Named tier with weighted pool. */
export const lootTierSchema = z.object({
  name: z.string().min(1),
  weight: z.number().positive(),
  pool: z.array(weightedSourceSchema).min(1)
});

/** Fixed drop. */
const fixedDropSchema = z.object({
  method: z.literal("fixed"),
  source: lootSourceSchema,
  count: z.number().int().positive().optional()
});

/** Uniform drop. */
const uniformDropSchema = z.object({
  method: z.literal("uniform"),
  pool: z.array(lootSourceSchema).min(1),
  count: z.number().int().positive().optional()
});

/** Weighted drop. */
const weightedDropSchema = z.object({
  method: z.literal("weighted"),
  pool: z.array(weightedSourceSchema).min(1),
  count: z.number().int().positive().optional()
});

/** Tiered drop. */
const tieredDropSchema = z.object({
  method: z.literal("tiered"),
  tiers: z.array(lootTierSchema).min(1),
  count: z.number().int().positive().optional()
});

/** Any drop method (discriminated union on `method`). */
export const lootDropSchema = z.discriminatedUnion("method", [
  fixedDropSchema,
  uniformDropSchema,
  weightedDropSchema,
  tieredDropSchema
]);

/** Standalone loot table definition. */
export const lootTableDefinitionSchema = z.object({
  id: z.string().min(1),
  drops: z.array(lootDropSchema).min(1)
});
