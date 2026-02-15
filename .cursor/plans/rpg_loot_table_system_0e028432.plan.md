---
name: RPG Loot Table System
overview: Introduce a configurable loot table system alongside the existing simple container loot. New containers use a `drops` array with four selection methods (fixed, uniform, weighted, tiered), where sources can be concrete items or recursive table references. Standalone loot tables live in `content/loot-tables/` and are resolved at runtime with a recursion depth limit.
todos:
  - id: shared-types
    content: Create packages/shared/src/types/lootTable.ts -- copy the exact type definitions from the plan
    status: completed
  - id: shared-schemas
    content: Create packages/shared/src/validators/lootTable.schema.ts -- copy the exact Zod schemas from the plan
    status: completed
  - id: update-container-types
    content: Edit container.ts types and container.schema.ts validator -- apply the exact diffs from the plan
    status: completed
  - id: export-shared
    content: Add two export lines to packages/shared/src/index.ts
    status: completed
  - id: loot-table-loader
    content: Create server/src/inventory/LootTableLoader.ts -- model after ContainerDefinitionLoader with loot-table file suffix
    status: completed
  - id: loot-resolver
    content: Create server/src/inventory/LootResolver.ts -- copy the exact class from the plan
    status: completed
  - id: loot-resolver-tests
    content: Create server/src/inventory/LootResolver.test.ts -- write vitest tests for each method + recursion limit
    status: completed
  - id: integrate-container-service
    content: Edit ContainerService.ts -- add LootResolver constructor param, update rollLoot method
    status: completed
  - id: wire-up-server
    content: Edit server/src/index.ts and server/src/inventory/index.ts -- add LootTableLoader + LootResolver wiring
    status: completed
  - id: example-content
    content: Create content/loot-tables/ directory with example files and one new container
    status: completed
isProject: false
---

# RPG Loot Table System

## Step 1: Create shared types

Create file `packages/shared/src/types/lootTable.ts` with this exact content:

```typescript
import type { LootDrop } from "./lootTable.js";

/**
 * Quantity that is either a fixed number or a random range (inclusive).
 */
export type LootQuantity = number | { min: number; max: number };

/**
 * A source that produces loot -- either a concrete item or a reference to another loot table.
 */
export type LootSource =
  | { type: "item"; itemId: string; quantity: LootQuantity }
  | { type: "table"; tableId: string };

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
```

IMPORTANT: Remove the self-referencing import at the top -- that was a mistake in the template. The file has no imports; `LootDrop` is defined in the same file.

## Step 2: Create shared Zod schemas

Create file `packages/shared/src/validators/lootTable.schema.ts` with this exact content:

```typescript
import { z } from "zod";

/** Quantity: either a positive integer or a { min, max } range. */
export const lootQuantitySchema = z.union([
  z.number().int().positive(),
  z.object({
    min: z.number().int().positive(),
    max: z.number().int().positive()
  }).refine((r) => r.max >= r.min, { message: "max must be >= min" })
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

/** Discriminated union of source types. */
export const lootSourceSchema = z.discriminatedUnion("type", [
  itemSourceSchema,
  tableSourceSchema
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
```

## Step 3: Update container types and schema

### 3a. Edit `packages/shared/src/types/container.ts`

Add import at top:

```typescript
import type { LootDrop } from "./lootTable.js";
```

Change the `ContainerDefinition` interface -- make `loot` optional and add `drops`:

Replace this:

```typescript
export interface ContainerDefinition {
  id: string;
  kind: ContainerKind;
  loot: LootEntry[];
  currencyRewards: CurrencyReward[];
}
```

With this:

```typescript
/**
 * Container definition loaded from content JSON.
 * Uses either legacy `loot` (flat list, all granted) or new `drops` (RPG loot table system).
 * Exactly one of `loot` or `drops` must be present.
 */
export interface ContainerDefinition {
  id: string;
  kind: ContainerKind;
  /** Legacy flat loot list. Every entry is granted deterministically. */
  loot?: LootEntry[];
  /** RPG-style loot drops with configurable selection methods. */
  drops?: LootDrop[];
  currencyRewards: CurrencyReward[];
}
```

### 3b. Edit `packages/shared/src/validators/container.schema.ts`

Add import:

```typescript
import { lootDropSchema } from "./lootTable.schema.js";
```

Replace the `containerDefinitionSchema` with:

```typescript
/**
 * Runtime validator for container definition from content JSON.
 * Exactly one of `loot` or `drops` must be present.
 */
export const containerDefinitionSchema = z.object({
  id: z.string().min(1),
  kind: containerKindSchema,
  loot: z.array(lootEntrySchema).optional(),
  drops: z.array(lootDropSchema).min(1).optional(),
  currencyRewards: z.array(currencyRewardSchema)
}).refine(
  (d) => (d.loot !== undefined) !== (d.drops !== undefined),
  { message: "Exactly one of 'loot' or 'drops' must be provided" }
);
```

## Step 4: Export from shared index

Edit `packages/shared/src/index.ts`. Add these two lines (place them next to the existing container exports, around line 16-17):

```typescript
export * from "./types/lootTable.js";
export * from "./validators/lootTable.schema.js";
```

## Step 5: Create LootTableLoader

Create file `server/src/inventory/LootTableLoader.ts`. Model it exactly after `ContainerDefinitionLoader.ts` (same file at `server/src/inventory/ContainerDefinitionLoader.ts`), but with these differences:

- Subdirectory: `"loot-tables"` (not `"containers"`)
- File suffix: `".loot-table.json"` (not `".container.json"`)
- Import and use `lootTableDefinitionSchema` (not `containerDefinitionSchema`)
- Import type `LootTableDefinition` (not `ContainerDefinition`)
- Class name: `LootTableLoader`
- Cache type: `Map<string, LootTableDefinition>`

The class needs `loadAll(): Promise<void>` and `getDefinition(id: string): LootTableDefinition | undefined` -- same signatures as `ContainerDefinitionLoader`.

## Step 6: Create LootResolver

Create file `server/src/inventory/LootResolver.ts` with this exact content:

```typescript
import type { LootDrop, LootSource, LootQuantity, ResolvedLoot, WeightedSource, LootTier } from "@odyssey/shared";
import type { LootTableLoader } from "./LootTableLoader.js";

/** Maximum recursion depth for table references. */
const MAX_DEPTH = 10;

/**
 * Resolves loot drops into concrete item lists using an RNG function.
 */
export class LootResolver {
  constructor(private readonly tableLoader: LootTableLoader) {}

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
```

## Step 7: Write LootResolver tests

Create file `server/src/inventory/LootResolver.test.ts`. Use vitest (`import { describe, expect, it } from "vitest"`). Do NOT use filesystem -- build `LootDrop[]` arrays inline and pass a mock `LootTableLoader`.

Tests to write (one `it()` per bullet):

- **"fixed drop returns the source item"** -- single fixed drop with quantity 3, assert returns `[{ definitionId, quantity: 3 }]`
- **"fixed drop with quantity range resolves to value in range"** -- use `quantity: { min: 1, max: 5 }`, run 100 times with incrementing seed, assert all quantities are in [1, 5]
- **"uniform selects from pool"** -- pool of 3 items, run 100 times, assert all 3 items appear at least once
- **"weighted respects probabilities"** -- pool with weight 99 and weight 1, run 1000 times, assert the high-weight item appears > 900 times
- **"tiered rolls tier then selects from tier pool"** -- two tiers (weight 99 vs 1), each with one item, run 1000 times, assert the high-weight tier's item appears > 900 times
- **"table reference resolves recursively"** -- mock `tableLoader.getDefinition` to return a table with a fixed drop, assert the referenced item appears
- **"recursion depth limit throws"** -- mock a table that references itself, assert `resolve()` throws with "recursion limit"
- **"count rolls multiple times"** -- weighted drop with `count: 3`, assert result length is 3

Mock `LootTableLoader`:

```typescript
const mockTableLoader = {
  getDefinition: (id: string) => tables.get(id)
} as unknown as LootTableLoader;
```

For deterministic tests, use `createSeededRng` from `@odyssey/shared`:

```typescript
import { createSeededRng } from "@odyssey/shared";
const rng = createSeededRng(42);
```

## Step 8: Integrate into ContainerService

Edit `server/src/inventory/ContainerService.ts`:

### 8a. Add import and constructor parameter

Add import at top:

```typescript
import { createSeededRng } from "@odyssey/shared";
import type { LootResolver } from "./LootResolver.js";
```

Add `lootResolver` as the **last** constructor parameter:

```typescript
constructor(
  private readonly db: PostgresDatabase,
  private readonly containerLoader: ContainerDefinitionLoader,
  private readonly itemLoader: ItemDefinitionLoader,
  private readonly inventoryService: InventoryService,
  private readonly currencyService: CurrencyService,
  private readonly lootResolver: LootResolver
) {}
```

### 8b. Replace the `rollLoot` method

Replace the existing `private rollLoot(definition: ContainerDefinition): RolledLoot[]` method with:

```typescript
private rollLoot(definition: ContainerDefinition, seed: number): RolledLoot[] {
  if (definition.drops) {
    const rng = createSeededRng(seed);
    const resolved = this.lootResolver.resolve(definition.drops, rng);
    return resolved.map((r) => ({
      definitionId: r.definitionId,
      quantity: r.quantity,
      name: this.itemLoader.getDefinition(r.definitionId)?.name ?? r.definitionId
    }));
  }
  // Legacy path: grant all loot entries deterministically
  return (definition.loot ?? []).map((entry) => ({
    definitionId: entry.definitionId,
    quantity: entry.quantity,
    name: this.itemLoader.getDefinition(entry.definitionId)?.name ?? entry.definitionId
  }));
}
```

### 8c. Update all call sites of `rollLoot`

The method `rollLoot` is called in 3 places in ContainerService. Each call must now pass a seed. Use a hash of `userId + objectId` to make it deterministic per player per container.

Add this helper at the bottom of the file (outside the class):

```typescript
/** Simple string hash for deterministic seeding. */
function hashSeed(a: string, b: string): number {
  const str = a + ":" + b;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}
```

Then update the 3 call sites in `openContainer` and `claimContainer`. Each currently reads `this.rollLoot(definition)`. Change them all to `this.rollLoot(definition, hashSeed(userId, objectId))`. The `userId` and `objectId` variables are already in scope at each call site.

## Step 9: Wire up in server startup

### 9a. Edit `server/src/inventory/index.ts`

Add two export lines:

```typescript
export { LootTableLoader } from "./LootTableLoader.js";
export { LootResolver } from "./LootResolver.js";
```

### 9b. Edit `server/src/index.ts`

In the imports block (line 15-23), add `LootTableLoader` and `LootResolver` to the destructured import from `"./inventory/index.js"`:

```typescript
import {
  ContainerDefinitionLoader,
  ContainerService,
  CurrencyService,
  EquipmentService,
  InventoryService,
  ItemActionResolver,
  ItemDefinitionLoader,
  LootTableLoader,
  LootResolver
} from "./inventory/index.js";
```

After `await containerDefinitionLoader.loadAll();` (currently line 59), add:

```typescript
const lootTableLoader = new LootTableLoader(config.CONTENT_DIR);
await lootTableLoader.loadAll();
const lootResolver = new LootResolver(lootTableLoader);
```

Then update the `ContainerService` constructor call (currently lines 60-66) to pass `lootResolver` as the last argument:

```typescript
const containerService = new ContainerService(
  db,
  containerDefinitionLoader,
  itemDefinitionLoader,
  inventoryService,
  currencyService,
  lootResolver
);
```

## Step 10: Create example content

### 10a. Create `content/loot-tables/common_supplies.loot-table.json`

```json
{
  "id": "common_supplies",
  "drops": [
    {
      "method": "weighted",
      "pool": [
        { "weight": 50, "source": { "type": "item", "itemId": "herb", "quantity": { "min": 1, "max": 3 } } },
        { "weight": 30, "source": { "type": "item", "itemId": "scroll", "quantity": 1 } },
        { "weight": 20, "source": { "type": "item", "itemId": "stick", "quantity": 1 } }
      ]
    }
  ]
}
```

### 10b. Create `content/loot-tables/rare_gear.loot-table.json`

```json
{
  "id": "rare_gear",
  "drops": [
    {
      "method": "weighted",
      "pool": [
        { "weight": 60, "source": { "type": "item", "itemId": "fez", "quantity": 1 } },
        { "weight": 40, "source": { "type": "item", "itemId": "top-hat", "quantity": 1 } }
      ]
    }
  ]
}
```

### 10c. Create `content/containers/dungeon_chest.container.json`

```json
{
  "id": "dungeon_chest",
  "kind": "chest",
  "drops": [
    { "method": "fixed", "source": { "type": "item", "itemId": "scroll", "quantity": 1 } },
    {
      "method": "tiered",
      "count": 2,
      "tiers": [
        {
          "name": "Common",
          "weight": 60,
          "pool": [
            { "weight": 100, "source": { "type": "table", "tableId": "common_supplies" } }
          ]
        },
        {
          "name": "Rare",
          "weight": 30,
          "pool": [
            { "weight": 100, "source": { "type": "table", "tableId": "rare_gear" } }
          ]
        },
        {
          "name": "Epic",
          "weight": 10,
          "pool": [
            { "weight": 100, "source": { "type": "item", "itemId": "ancient-map", "quantity": 1 } }
          ]
        }
      ]
    }
  ],
  "currencyRewards": [
    { "currencyType": "coins", "amount": 15 }
  ]
}
```

## Validation

After all changes, run:

```sh
pnpm typecheck && pnpm lint && pnpm test
```

Fix any errors before considering done. Common pitfalls:

- Missing `.js` extension on imports (this project uses ESM -- all relative imports need `.js`)
- Forgetting to add JSDoc to public exports
- The Zod `.refine()` on `containerDefinitionSchema` changes its inferred type -- ensure `ContainerDefinition` is still compatible

