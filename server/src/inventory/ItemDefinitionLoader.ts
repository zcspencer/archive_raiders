import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import type { ItemDefinition } from "@odyssey/shared";
import { itemDefinitionSchema } from "@odyssey/shared";
import { resolveContentDirectory } from "../contentPath.js";

const ITEMS_SUBDIR = "items";
const ITEM_FILE_SUFFIX = ".item.json";

/**
 * Loads and caches item definitions from content/items/*.item.json.
 * Validates with Zod only; component registry validation is in Phase 3.
 */
export class ItemDefinitionLoader {
  private readonly resolvedDir: string;
  private cache: Map<string, ItemDefinition> = new Map();

  constructor(contentDir: string) {
    const contentRoot = resolveContentDirectory(contentDir);
    this.resolvedDir = resolve(contentRoot, ITEMS_SUBDIR);
  }

  /**
   * Loads all definitions from disk and populates cache. Call at startup.
   */
  async loadAll(): Promise<void> {
    this.cache.clear();
    if (!existsSync(this.resolvedDir)) return;
    const entries = await readdir(this.resolvedDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(ITEM_FILE_SUFFIX)) continue;
      const path = join(this.resolvedDir, entry.name);
      const raw = await readFile(path, "utf-8");
      const parsed = JSON.parse(raw) as unknown;
      const result = itemDefinitionSchema.safeParse(parsed);
      if (!result.success) continue;
      this.cache.set(result.data.id, result.data);
    }
  }

  /**
   * Returns definition by id (latest version in cache).
   */
  getDefinition(id: string): ItemDefinition | undefined {
    return this.cache.get(id);
  }

  /**
   * Returns definition by id and version.
   */
  getDefinitionWithVersion(id: string, version: number): ItemDefinition | undefined {
    const def = this.cache.get(id);
    return def?.version === version ? def : undefined;
  }

  /**
   * Returns all loaded definitions.
   */
  getAllDefinitions(): ItemDefinition[] {
    return Array.from(this.cache.values());
  }
}
