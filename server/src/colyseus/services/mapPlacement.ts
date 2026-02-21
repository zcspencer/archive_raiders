import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { MapWorldObjectPlacement, TiledMapData, TiledObject, TiledProperty, TiledLayer } from "@odyssey/shared";
import { createSeededRng } from "@odyssey/shared";
import { resolveContentDirectory } from "../../contentPath.js";

/**
 * Mapping from boot.json registryKey to map filename (e.g. "parsedMap_village" -> "village.json").
 */
export interface MapRegistryEntry {
  registryKey: string;
  file: string;
}

/**
 * Extracts world_object placements from a Tiled JSON map's objects layer.
 */
export function extractWorldObjectPlacements(data: TiledMapData): MapWorldObjectPlacement[] {
  const objectsLayer = data.layers.find(
    (l: TiledLayer) => l.name === "objects" && l.type === "objectgroup"
  );
  if (!objectsLayer?.objects) return [];

  const placements: MapWorldObjectPlacement[] = [];
  for (const obj of objectsLayer.objects) {
    const kind = getProp(obj, "kind", "");
    if (obj.type !== "world_object" && kind !== "world_object") continue;
    const defId = getProp(obj, "definition_id", obj.name);
    const gx = Math.floor(obj.x / data.tilewidth);
    const gy = Math.floor(obj.y / data.tileheight);
    placements.push({ definition_id: defId, gridX: gx, gridY: gy });
  }
  return placements;
}

/** Configuration for procedural object scattering on a single map. */
export interface ProceduralPlacementRule {
  definitionId: string;
  /** Probability per tile (0-1). */
  density: number;
  /** Chebyshev distance between placed objects. */
  minSpacing?: number;
}

/**
 * Generates world object placements procedurally within a map grid.
 * @param width map width in tiles
 * @param height map height in tiles
 * @param rules what to place and how densely
 * @param seed deterministic RNG seed
 * @param occupied set of "gridX,gridY" strings already taken (spawns, NPCs, manual placements, etc.)
 */
export function generateProceduralPlacements(
  width: number,
  height: number,
  rules: ProceduralPlacementRule[],
  seed: number,
  occupied: Set<string>
): MapWorldObjectPlacement[] {
  const rng = createSeededRng(seed);
  const placements: MapWorldObjectPlacement[] = [];
  const placed = new Set<string>(occupied);

  for (const rule of rules) {
    const spacing = rule.minSpacing ?? 1;
    for (let gy = 0; gy < height; gy++) {
      for (let gx = 0; gx < width; gx++) {
        const key = `${gx},${gy}`;
        if (placed.has(key)) continue;
        if (rng() > rule.density) continue;
        if (hasTooCloseNeighbor(gx, gy, spacing, placed)) continue;
        placements.push({ definition_id: rule.definitionId, gridX: gx, gridY: gy });
        placed.add(key);
      }
    }
  }
  return placements;
}

function hasTooCloseNeighbor(
  gx: number,
  gy: number,
  spacing: number,
  placed: Set<string>
): boolean {
  for (let dy = -spacing; dy <= spacing; dy++) {
    for (let dx = -spacing; dx <= spacing; dx++) {
      if (dx === 0 && dy === 0) continue;
      if (placed.has(`${gx + dx},${gy + dy}`)) return true;
    }
  }
  return false;
}

/**
 * Loads all Tiled map JSON files from disk and returns per-registryKey world object placements.
 * Reads `content/boot.json` for the registry → file mapping, then parses each map.
 */
export async function loadAllMapPlacements(
  contentDir: string
): Promise<Map<string, MapWorldObjectPlacement[]>> {
  const resolved = resolveContentDirectory(contentDir);
  const bootPath = join(resolved, "boot.json");
  const bootRaw = await readFile(bootPath, "utf-8");
  const boot = JSON.parse(bootRaw) as { maps: MapRegistryEntry[] };

  const result = new Map<string, MapWorldObjectPlacement[]>();
  for (const entry of boot.maps) {
    const mapPath = join(resolved, "maps", entry.file);
    try {
      const raw = await readFile(mapPath, "utf-8");
      const mapData = JSON.parse(raw) as TiledMapData;
      const placements = extractWorldObjectPlacements(mapData);
      result.set(entry.registryKey, placements);
    } catch {
      result.set(entry.registryKey, []);
    }
  }
  return result;
}

function getProp(obj: TiledObject, name: string, fallback: string): string {
  const p = obj.properties?.find((x: TiledProperty) => x.name === name);
  return p ? String(p.value) : fallback;
}
