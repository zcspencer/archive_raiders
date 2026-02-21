import { createSeededRng } from "@odyssey/shared";
import type { ItemDefinition, LootTableDefinition } from "@odyssey/shared";
import { describe, expect, it } from "vitest";
import type { ItemDefinitionLoader } from "./ItemDefinitionLoader.js";
import type { LootTableLoader } from "./LootTableLoader.js";
import { LootResolver } from "./LootResolver.js";

/** Helper: builds mock loaders and a resolver from optional maps. */
function buildResolver(
  tables?: Map<string, LootTableDefinition>,
  items?: ItemDefinition[]
): LootResolver {
  const tableMap = tables ?? new Map<string, LootTableDefinition>();
  const mockTableLoader = {
    getDefinition: (id: string) => tableMap.get(id)
  } as unknown as LootTableLoader;
  const mockItemLoader = {
    getAllDefinitions: () => items ?? []
  } as unknown as ItemDefinitionLoader;
  return new LootResolver(mockTableLoader, mockItemLoader);
}

describe("LootResolver", () => {
  it("fixed drop returns the source item", () => {
    const resolver = buildResolver();
    const drops = [
      {
        method: "fixed" as const,
        source: { type: "item" as const, itemId: "herb", quantity: 3 }
      }
    ];
    const rng = createSeededRng(42);
    const result = resolver.resolve(drops, rng);
    expect(result).toEqual([{ definitionId: "herb", quantity: 3 }]);
  });

  it("fixed drop with quantity range resolves to value in range", () => {
    const resolver = buildResolver();
    const drops = [
      {
        method: "fixed" as const,
        source: {
          type: "item" as const,
          itemId: "herb",
          quantity: { min: 1, max: 5 }
        }
      }
    ];
    for (let seed = 0; seed < 100; seed++) {
      const rng = createSeededRng(seed);
      const result = resolver.resolve(drops, rng);
      expect(result).toHaveLength(1);
      expect(result[0]!.definitionId).toBe("herb");
      expect(result[0]!.quantity).toBeGreaterThanOrEqual(1);
      expect(result[0]!.quantity).toBeLessThanOrEqual(5);
    }
  });

  it("uniform selects from pool", () => {
    const resolver = buildResolver();
    const poolIds = ["a", "b", "c"];
    const drops = [
      {
        method: "uniform" as const,
        pool: poolIds.map((itemId) => ({
          type: "item" as const,
          itemId,
          quantity: 1
        }))
      }
    ];
    const seen = new Set<string>();
    const rng = createSeededRng(42);
    for (let i = 0; i < 100; i++) {
      const result = resolver.resolve(drops, rng);
      expect(result).toHaveLength(1);
      expect(poolIds).toContain(result[0]!.definitionId);
      seen.add(result[0]!.definitionId);
    }
    expect(seen.size).toBeGreaterThanOrEqual(2);
  });

  it("weighted respects probabilities", () => {
    const resolver = buildResolver();
    const drops = [
      {
        method: "weighted" as const,
        pool: [
          {
            weight: 99,
            source: { type: "item" as const, itemId: "common", quantity: 1 }
          },
          {
            weight: 1,
            source: { type: "item" as const, itemId: "rare", quantity: 1 }
          }
        ]
      }
    ];
    let commonCount = 0;
    for (let seed = 0; seed < 1000; seed++) {
      const rng = createSeededRng(seed);
      const result = resolver.resolve(drops, rng);
      expect(result).toHaveLength(1);
      if (result[0]!.definitionId === "common") commonCount++;
    }
    expect(commonCount).toBeGreaterThan(900);
  });

  it("tiered rolls tier then selects from tier pool", () => {
    const resolver = buildResolver();
    const drops = [
      {
        method: "tiered" as const,
        tiers: [
          {
            name: "Common",
            weight: 99,
            pool: [
              {
                weight: 100,
                source: { type: "item" as const, itemId: "common", quantity: 1 }
              }
            ]
          },
          {
            name: "Rare",
            weight: 1,
            pool: [
              {
                weight: 100,
                source: { type: "item" as const, itemId: "rare", quantity: 1 }
              }
            ]
          }
        ]
      }
    ];
    let commonCount = 0;
    for (let seed = 0; seed < 1000; seed++) {
      const rng = createSeededRng(seed);
      const result = resolver.resolve(drops, rng);
      expect(result).toHaveLength(1);
      if (result[0]!.definitionId === "common") commonCount++;
    }
    expect(commonCount).toBeGreaterThan(900);
  });

  it("table reference resolves recursively", () => {
    const tables = new Map<string, LootTableDefinition>();
    tables.set("nested", {
      id: "nested",
      drops: [
        {
          method: "fixed" as const,
          source: { type: "item" as const, itemId: "from_table", quantity: 2 }
        }
      ]
    });
    const resolver = buildResolver(tables);
    const drops = [
      {
        method: "fixed" as const,
        source: { type: "table" as const, tableId: "nested" }
      }
    ];
    const rng = createSeededRng(42);
    const result = resolver.resolve(drops, rng);
    expect(result).toEqual([{ definitionId: "from_table", quantity: 2 }]);
  });

  it("recursion depth limit throws", () => {
    const tables = new Map<string, LootTableDefinition>();
    tables.set("self_ref", {
      id: "self_ref",
      drops: [
        {
          method: "fixed" as const,
          source: { type: "table" as const, tableId: "self_ref" }
        }
      ]
    });
    const resolver = buildResolver(tables);
    const drops = [
      {
        method: "fixed" as const,
        source: { type: "table" as const, tableId: "self_ref" }
      }
    ];
    const rng = createSeededRng(42);
    expect(() => resolver.resolve(drops, rng)).toThrow("recursion limit");
  });

  it("count rolls multiple times", () => {
    const resolver = buildResolver();
    const drops = [
      {
        method: "weighted" as const,
        count: 3,
        pool: [
          {
            weight: 100,
            source: { type: "item" as const, itemId: "herb", quantity: 1 }
          }
        ]
      }
    ];
    const rng = createSeededRng(42);
    const result = resolver.resolve(drops, rng);
    expect(result).toHaveLength(3);
    expect(result.every((r) => r.definitionId === "herb" && r.quantity === 1)).toBe(true);
  });

  it("tag source picks from matching items", () => {
    const items: ItemDefinition[] = [
      { id: "amethyst", version: 1, name: "Amethyst", description: "", maxStackSize: 20, inventorySprite: "x", rarity: "Common", tags: ["gem"], components: [] },
      { id: "sapphire", version: 1, name: "Sapphire", description: "", maxStackSize: 20, inventorySprite: "x", rarity: "Epic", tags: ["gem"], components: [] },
      { id: "stick", version: 1, name: "Stick", description: "", maxStackSize: 20, inventorySprite: "x", rarity: "Common", components: [] }
    ];
    const resolver = buildResolver(undefined, items);
    const drops = [
      {
        method: "fixed" as const,
        source: { type: "tag" as const, tag: "gem", quantity: 1 }
      }
    ];
    const seen = new Set<string>();
    const rng = createSeededRng(42);
    for (let i = 0; i < 100; i++) {
      const result = resolver.resolve(drops, rng);
      expect(result).toHaveLength(1);
      expect(["amethyst", "sapphire"]).toContain(result[0]!.definitionId);
      seen.add(result[0]!.definitionId);
    }
    expect(seen.size).toBe(2);
  });

  it("tag source with rarity filter narrows candidates", () => {
    const items: ItemDefinition[] = [
      { id: "amethyst", version: 1, name: "Amethyst", description: "", maxStackSize: 20, inventorySprite: "x", rarity: "Common", tags: ["gem"], components: [] },
      { id: "sapphire", version: 1, name: "Sapphire", description: "", maxStackSize: 20, inventorySprite: "x", rarity: "Epic", tags: ["gem"], components: [] }
    ];
    const resolver = buildResolver(undefined, items);
    const drops = [
      {
        method: "fixed" as const,
        source: { type: "tag" as const, tag: "gem", rarity: "Epic" as const, quantity: 1 }
      }
    ];
    const rng = createSeededRng(42);
    const result = resolver.resolve(drops, rng);
    expect(result).toEqual([{ definitionId: "sapphire", quantity: 1 }]);
  });

  it("nothing source returns empty results", () => {
    const resolver = buildResolver();
    const drops = [
      {
        method: "fixed" as const,
        source: { type: "nothing" as const }
      }
    ];
    const rng = createSeededRng(42);
    const result = resolver.resolve(drops, rng);
    expect(result).toEqual([]);
  });

  it("weighted pool with nothing source can produce empty or item results", () => {
    const resolver = buildResolver();
    const drops = [
      {
        method: "weighted" as const,
        pool: [
          {
            weight: 50,
            source: { type: "nothing" as const }
          },
          {
            weight: 50,
            source: { type: "item" as const, itemId: "gem", quantity: 1 }
          }
        ]
      }
    ];
    let gemCount = 0;
    let emptyCount = 0;
    const rng = createSeededRng(12345);
    for (let i = 0; i < 200; i++) {
      const result = resolver.resolve(drops, rng);
      if (result.length === 0) emptyCount++;
      if (result.length === 1 && result[0]!.definitionId === "gem") gemCount++;
    }
    expect(gemCount + emptyCount).toBe(200);
    expect(gemCount).toBeGreaterThan(0);
    expect(emptyCount).toBeGreaterThan(0);
  });

  it("tag source throws when no items match", () => {
    const resolver = buildResolver(undefined, []);
    const drops = [
      {
        method: "fixed" as const,
        source: { type: "tag" as const, tag: "nonexistent", quantity: 1 }
      }
    ];
    const rng = createSeededRng(42);
    expect(() => resolver.resolve(drops, rng)).toThrow('No items found with tag "nonexistent"');
  });
});
