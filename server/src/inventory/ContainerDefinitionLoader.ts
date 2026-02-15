import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import type { ContainerDefinition } from "@odyssey/shared";
import { containerDefinitionSchema } from "@odyssey/shared";
import { resolveContentDirectory } from "../contentPath.js";

const CONTAINERS_SUBDIR = "containers";
const CONTAINER_FILE_SUFFIX = ".container.json";

/**
 * Loads and caches container definitions from content/containers/*.container.json.
 */
export class ContainerDefinitionLoader {
  private readonly resolvedDir: string;
  private cache: Map<string, ContainerDefinition> = new Map();

  constructor(contentDir: string) {
    const contentRoot = resolveContentDirectory(contentDir);
    this.resolvedDir = resolve(contentRoot, CONTAINERS_SUBDIR);
  }

  /**
   * Loads all definitions from disk and populates cache. Call at startup.
   */
  async loadAll(): Promise<void> {
    this.cache.clear();
    if (!existsSync(this.resolvedDir)) return;
    const entries = await readdir(this.resolvedDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(CONTAINER_FILE_SUFFIX)) continue;
      const path = join(this.resolvedDir, entry.name);
      const raw = await readFile(path, "utf-8");
      const parsed = JSON.parse(raw) as unknown;
      const result = containerDefinitionSchema.safeParse(parsed);
      if (!result.success) {
        console.warn(
          `[ContainerDefinitionLoader] Skipped ${entry.name}: ${result.error.message}`
        );
        continue;
      }
      this.cache.set(result.data.id, result.data);
    }
  }

  /**
   * Returns definition by id (e.g. objectId from map).
   */
  getDefinition(objectId: string): ContainerDefinition | undefined {
    return this.cache.get(objectId);
  }
}
