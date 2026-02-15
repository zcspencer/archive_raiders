import type {
  LootDrop,
  LootSource,
  LootQuantity,
  ResolvedLoot,
  WeightedSource,
  LootTier
} from "@odyssey/shared";
import type { ItemDefinitionLoader } from "./ItemDefinitionLoader.js";
import type { LootTableLoader } from "./LootTableLoader.js";

/** Maximum recursion depth for table references. */
const MAX_DEPTH = 10;

/**
 * Resolves loot drops into concrete item lists using an RNG function.
 */
export class LootResolver {
  constructor(
    private readonly tableLoader: LootTableLoader,
    private readonly itemLoader: ItemDefinitionLoader
  ) {}

  /**
   * Resolves an array of drops into a flat list of concrete items.
   * @param drops - The drop instructions to resolve.
   * @param rng - A function returning a float in [0, 1). Use createSeededRng for determinism.
   * @param depth - Current recursion depth (callers should omit; used internally).
   */
  resolve(drops: LootDrop[], rng: () => number, depth: number = 0): ResolvedLoot[] {
    if (depth >= MAX_DEPTH) {
      throw new Error(`Loot table recursion limit exceeded (depth=${depth})`);
    }

    const results: ResolvedLoot[] = [];
    for (const drop of drops) {
      const count = drop.count ?? 1;
      for (let i = 0; i < count; i++) {
        const source = this.selectSource(drop, rng);
        const resolved = this.resolveSource(source, rng, depth);
        results.push(...resolved);
      }
    }
    return results;
  }

  /** Pick a source from a drop based on its method. */
  private selectSource(drop: LootDrop, rng: () => number): LootSource {
    switch (drop.method) {
      case "fixed":
        return drop.source;
      case "uniform":
        return drop.pool[Math.floor(rng() * drop.pool.length)]!;
      case "weighted":
        return selectWeighted(drop.pool, rng);
      case "tiered": {
        const tier = selectWeightedTier(drop.tiers, rng);
        return selectWeighted(tier.pool, rng);
      }
    }
  }

  /** Resolve a single source into concrete items. */
  private resolveSource(source: LootSource, rng: () => number, depth: number): ResolvedLoot[] {
    if (source.type === "item") {
      const quantity = resolveQuantity(source.quantity, rng);
      return [{ definitionId: source.itemId, quantity }];
    }
    if (source.type === "tag") {
      const candidates = this.itemLoader
        .getAllDefinitions()
        .filter((def) => def.tags?.includes(source.tag))
        .filter((def) => !source.rarity || def.rarity === source.rarity);
      if (candidates.length === 0) {
        throw new Error(
          `No items found with tag "${source.tag}"${source.rarity ? ` and rarity "${source.rarity}"` : ""}`
        );
      }
      const picked = candidates[Math.floor(rng() * candidates.length)]!;
      const quantity = resolveQuantity(source.quantity, rng);
      return [{ definitionId: picked.id, quantity }];
    }
    // Table reference -- look up and recurse
    const table = this.tableLoader.getDefinition(source.tableId);
    if (!table) {
      throw new Error(`Loot table not found: ${source.tableId}`);
    }
    return this.resolve(table.drops, rng, depth + 1);
  }
}

/** Resolve a LootQuantity to a concrete number. */
function resolveQuantity(qty: LootQuantity, rng: () => number): number {
  if (typeof qty === "number") return qty;
  // Random integer in [min, max] inclusive
  return qty.min + Math.floor(rng() * (qty.max - qty.min + 1));
}

/**
 * Weighted random selection from an array of { weight, source }.
 * Weights do not need to sum to any particular value.
 */
function selectWeighted(pool: WeightedSource[], rng: () => number): LootSource {
  const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = rng() * totalWeight;
  for (const entry of pool) {
    roll -= entry.weight;
    if (roll <= 0) return entry.source;
  }
  // Fallback (should not happen with valid weights)
  return pool[pool.length - 1]!.source;
}

/**
 * Weighted random selection from an array of tiers.
 */
function selectWeightedTier(tiers: LootTier[], rng: () => number): LootTier {
  const totalWeight = tiers.reduce((sum, t) => sum + t.weight, 0);
  let roll = rng() * totalWeight;
  for (const tier of tiers) {
    roll -= tier.weight;
    if (roll <= 0) return tier;
  }
  return tiers[tiers.length - 1]!;
}
