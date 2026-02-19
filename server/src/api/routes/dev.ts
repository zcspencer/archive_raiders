import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { FastifyInstance } from "fastify";
import type { ContainerDefinitionLoader } from "../../inventory/ContainerDefinitionLoader.js";
import type { ItemDefinitionLoader } from "../../inventory/ItemDefinitionLoader.js";
import type { LootTableLoader } from "../../inventory/LootTableLoader.js";
import { resolveContentDirectory } from "../../contentPath.js";

export interface ReloadContentResult {
  ok: boolean;
  items: number;
}

/**
 * Reads all JSON files matching a suffix from a directory and returns them keyed by filename.
 */
async function readJsonDir(
  dir: string,
  suffix: string
): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  if (!existsSync(dir)) return result;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(suffix)) continue;
    const raw = await readFile(join(dir, entry.name), "utf-8");
    result[entry.name] = JSON.parse(raw) as unknown;
  }
  return result;
}

/**
 * Recursively reads all JSON files matching a suffix from a directory tree.
 */
async function readJsonDirRecursive(
  dir: string,
  suffix: string
): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  if (!existsSync(dir)) return result;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await readJsonDirRecursive(fullPath, suffix);
      Object.assign(result, nested);
    } else if (entry.isFile() && entry.name.endsWith(suffix)) {
      const raw = await readFile(fullPath, "utf-8");
      result[entry.name] = JSON.parse(raw) as unknown;
    }
  }
  return result;
}

/**
 * Registers dev-only routes (content reload + fresh content serving).
 * Call only when NODE_ENV !== "production".
 */
export async function registerDevRoutes(
  app: FastifyInstance,
  contentDir: string,
  itemDefinitionLoader: ItemDefinitionLoader,
  containerDefinitionLoader: ContainerDefinitionLoader,
  lootTableLoader: LootTableLoader
): Promise<void> {
  const resolvedContent = resolveContentDirectory(contentDir);

  app.post<{ Reply: ReloadContentResult }>(
    "/dev/reload-content",
    async (): Promise<ReloadContentResult> => {
      await itemDefinitionLoader.loadAll();
      await containerDefinitionLoader.loadAll();
      await lootTableLoader.loadAll();
      const items = itemDefinitionLoader.getAllDefinitions().length;
      return { ok: true, items };
    }
  );

  app.get("/dev/content", async () => {
    const [maps, items, npcs, tasks] = await Promise.all([
      readJsonDir(join(resolvedContent, "maps"), ".json"),
      readJsonDir(join(resolvedContent, "items"), ".item.json"),
      readJsonDir(join(resolvedContent, "npcs"), ".json"),
      readJsonDirRecursive(join(resolvedContent, "tasks"), ".task.json")
    ]);
    return { maps, items, npcs, tasks };
  });
}
