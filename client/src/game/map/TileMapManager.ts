import type {
  TiledMapData,
  TiledLayer,
  TiledObject,
  MapNpcPlacement,
  MapObjectPlacement,
  TiledProperty
} from "@odyssey/shared";
import { CollisionGrid } from "./collisionGrid";

/**
 * Result of parsing a Tiled JSON map.
 */
export interface ParsedMap {
  width: number;
  height: number;
  tileSize: number;
  groundData: number[];
  collisionGrid: CollisionGrid;
  npcs: MapNpcPlacement[];
  objects: MapObjectPlacement[];
  playerSpawn: { gridX: number; gridY: number };
}

/**
 * Parses a Tiled-format JSON map and extracts collision, ground, and object data.
 * Pure function with no Phaser dependency.
 */
export function parseMap(data: TiledMapData): ParsedMap {
  const groundLayer = findLayer(data.layers, "ground", "tilelayer");
  const collisionLayer = findLayer(data.layers, "collision", "tilelayer");
  const objectsLayer = findLayer(data.layers, "objects", "objectgroup");

  const groundData = groundLayer?.data ?? [];
  const collisionData = collisionLayer?.data ?? new Array(data.width * data.height).fill(1);
  const collisionGrid = new CollisionGrid(data.width, data.height, collisionData);

  const npcs: MapNpcPlacement[] = [];
  const objects: MapObjectPlacement[] = [];
  let playerSpawn = { gridX: 8, gridY: 9 };

  for (const obj of objectsLayer?.objects ?? []) {
    const gx = Math.floor(obj.x / data.tilewidth);
    const gy = Math.floor(obj.y / data.tileheight);

    if (obj.type === "npc") {
      npcs.push({ npcId: getProp(obj, "npcId", obj.name), gridX: gx, gridY: gy });
    } else if (obj.type === "interactable") {
      objects.push({
        objectId: getProp(obj, "objectId", obj.name),
        kind: getProp(obj, "kind", "artifact"),
        label: getProp(obj, "label", obj.name),
        gridX: gx,
        gridY: gy
      });
    } else if (obj.type === "spawn") {
      playerSpawn = { gridX: gx, gridY: gy };
    }
  }

  return {
    width: data.width,
    height: data.height,
    tileSize: data.tilewidth,
    groundData,
    collisionGrid,
    npcs,
    objects,
    playerSpawn
  };
}

/** Finds a layer by name and type. */
function findLayer(
  layers: TiledLayer[],
  name: string,
  type: TiledLayer["type"]
): TiledLayer | undefined {
  return layers.find((l) => l.name === name && l.type === type);
}

/** Reads a custom property string from a Tiled object. */
function getProp(obj: TiledObject, name: string, fallback: string): string {
  const prop: TiledProperty | undefined = obj.properties?.find((p) => p.name === name);
  return prop ? String(prop.value) : fallback;
}
