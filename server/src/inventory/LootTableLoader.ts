import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import type { LootTableDefinition } from "@odyssey/shared";
import { lootTableDefinitionSchema } from "@odyssey/shared";
import { resolveContentDirectory } from "../contentPath.js";

const LOOT_TABLES_SUBDIR = "loot-tables";
const LOOT_TABLE_FILE_SUFFIX = ".loot-table.json";

/**
 * Loads and caches loot table definitions from content/loot-tables/*.loot-table.json.
 */
export class LootTableLoader {
  private readonly resolvedDir: string;
  private cache: Map<string, LootTableDefinition> = new Map();

  constructor(contentDir: string) {
    const contentRoot = resolveContentDirectory(contentDir);
    this.resolvedDir = resolve(contentRoot, LOOT_TABLES_SUBDIR);
  }

  /**
   * Loads all definitions from disk and populates cache. Call at startup.
   */
  async loadAll(): Promise<void> {
    this.cache.clear();
    if (!existsSync(this.resolvedDir)) return;
    const entries = await readdir(this.resolvedDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(LOOT_TABLE_FILE_SUFFIX)) continue;
      const path = join(this.resolvedDir, entry.name);
      const raw = await readFile(path, "utf-8");
      const parsed = JSON.parse(raw) as unknown;
      const result = lootTableDefinitionSchema.safeParse(parsed);
      if (!result.success) continue;
      this.cache.set(result.data.id, result.data);
    }
  }

  /**
   * Returns definition by id.
   */
  getDefinition(id: string): LootTableDefinition | undefined {
    return this.cache.get(id);
  }
}
