/**
 * Quantity that is either a fixed number or a random range (inclusive).
 */
export type LootQuantity = number | { min: number; max: number };

import type { ItemRarity } from "./itemDefinition.js";

/**
 * A source that produces loot -- a concrete item, a table reference, or a tag-based query.
 * Tag sources pick uniformly from all items matching the tag (and optional rarity filter).
 */
export type LootSource =
  | { type: "item"; itemId: string; quantity: LootQuantity }
  | { type: "table"; tableId: string }
  | { type: "tag"; tag: string; quantity: LootQuantity; rarity?: ItemRarity }
  | { type: "nothing" };

/**
 * A source paired with a probability weight for weighted/tiered selection.
 */
export interface WeightedSource {
  weight: number;
  source: LootSource;
}

/**
 * A named tier with a selection weight and its own weighted pool.
 */
export interface LootTier {
  name: string;
  weight: number;
  pool: WeightedSource[];
}

/**
 * A single drop instruction. Discriminated union on `method`.
 * `count` defaults to 1 and controls how many times the selection is rolled.
 */
export type LootDrop =
  | { method: "fixed"; source: LootSource; count?: number }
  | { method: "uniform"; pool: LootSource[]; count?: number }
  | { method: "weighted"; pool: WeightedSource[]; count?: number }
  | { method: "tiered"; tiers: LootTier[]; count?: number };

/**
 * Destroyable component params. Used for world objects that can be damaged and drop loot.
 */
export interface DestroyableParams {
  health: number;
  drops?: LootDrop[];
}

/**
 * Standalone loot table loaded from content/loot-tables/*.loot-table.json.
 * Can be referenced by `tableId` from any LootSource.
 */
export interface LootTableDefinition {
  id: string;
  drops: LootDrop[];
}

/**
 * Resolved concrete item after all table references and RNG are evaluated.
 */
export interface ResolvedLoot {
  definitionId: string;
  quantity: number;
}
