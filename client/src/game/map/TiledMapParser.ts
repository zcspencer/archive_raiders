import type {
  TiledMapData,
  TiledLayer,
  TiledObject,
  TiledProperty,
  MapNpcPlacement,
  MapObjectPlacement,
  MapTransition
} from "@odyssey/shared";
import { CollisionGrid } from "./collisionGrid";
import { rasterizeCollision } from "./collisionRasterizer";

/**
 * Result of parsing a Tiled JSON map.
 */
export interface ParsedTiledMap {
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  groundData: number[];
  detailDownData: number[];
  detailUpData: number[];
  collisionGrid: CollisionGrid;
  spawns: Map<string, { gridX: number; gridY: number }>;
  npcs: MapNpcPlacement[];
  interactables: MapObjectPlacement[];
  transitions: MapTransition[];
  firstGid: number;
  tilesetSource: string;
}

/**
 * Parses a Tiled-format JSON map. Supports tile layers (ground, detail_down,
 * detail_up), object layers (objects, collision), and tileset references.
 */
export function parseTiledMap(data: TiledMapData): ParsedTiledMap {
  const groundLayer = findTileLayer(data.layers, "ground");
  const detailDownLayer = findTileLayer(data.layers, "detail_down");
  const detailUpLayer = findTileLayer(data.layers, "detail_up");
  const objectsLayer = findObjectLayer(data.layers, "objects");
  const collisionObjectLayer = findObjectLayer(data.layers, "collision");
  const collisionTileLayer = findTileLayer(data.layers, "collision");

  const size = data.width * data.height;
  const emptyTileArray = (): number[] => new Array(size).fill(0);

  const groundData = groundLayer?.data ?? emptyTileArray();
  const detailDownData = detailDownLayer?.data ?? emptyTileArray();
  const detailUpData = detailUpLayer?.data ?? emptyTileArray();

  const spawns = new Map<string, { gridX: number; gridY: number }>();
  const npcs: MapNpcPlacement[] = [];
  const interactables: MapObjectPlacement[] = [];
  const transitions: MapTransition[] = [];
  const blockedTiles: Array<{ gx: number; gy: number }> = [];

  for (const obj of objectsLayer?.objects ?? []) {
    const gx = Math.floor(obj.x / data.tilewidth);
    const gy = Math.floor(obj.y / data.tileheight);

    if (obj.type === "spawn" || getProp(obj, "kind", "") === "spawn") {
      spawns.set(obj.name || `spawn_${obj.id}`, { gridX: gx, gridY: gy });
    } else if (obj.type === "npc" || getProp(obj, "kind", "") === "npc") {
      npcs.push({
        npc_id: getProp(obj, "npc_id", obj.name),
        gridX: gx,
        gridY: gy
      });
      blockedTiles.push({ gx, gy });
    } else {
      const destMap = getOptionalProp(obj, "destination_map");
      const objectId = getOptionalProp(obj, "object_id");
      const kind = getProp(obj, "kind", "interactable");

      if (destMap) {
        transitions.push({
          name: obj.name || `transition_${obj.id}`,
          gridX: gx,
          gridY: gy,
          destination_map: destMap,
          destination_spawn: getProp(obj, "destination_spawn", ""),
          label: getOptionalProp(obj, "label")
        });
        blockedTiles.push({ gx, gy });
      } else if (objectId) {
        interactables.push({
          object_id: objectId,
          kind: kind === "container" ? "chest" : kind,
          label: getProp(obj, "label", obj.name),
          gridX: gx,
          gridY: gy,
          ...(getOptionalProp(obj, "task_id") && {
            task_id: getOptionalProp(obj, "task_id")
          })
        });
        blockedTiles.push({ gx, gy });
      }
    }
  }

  let collisionGrid: CollisionGrid;
  if (collisionObjectLayer?.objects?.length) {
    const rasterized = rasterizeCollision(
      collisionObjectLayer.objects,
      data.width,
      data.height,
      data.tilewidth,
      data.tileheight
    );
    const flat: number[] = [];
    for (let y = 0; y < data.height; y++) {
      for (let x = 0; x < data.width; x++) {
        const walkable = rasterized[y]![x]!;
        flat.push(walkable ? 0 : 1);
      }
    }
    for (const { gx, gy } of blockedTiles) {
      if (gx >= 0 && gx < data.width && gy >= 0 && gy < data.height) {
        flat[gy * data.width + gx] = 1;
      }
    }
    collisionGrid = new CollisionGrid(data.width, data.height, flat);
  } else if (collisionTileLayer?.data) {
    const flat = collisionTileLayer.data.map((v) => (v === 0 ? 0 : 1));
    for (const { gx, gy } of blockedTiles) {
      if (gx >= 0 && gx < data.width && gy >= 0 && gy < data.height) {
        flat[gy * data.width + gx] = 1;
      }
    }
    collisionGrid = new CollisionGrid(data.width, data.height, flat);
  } else {
    const flat = new Array(size).fill(0);
    for (const { gx, gy } of blockedTiles) {
      if (gx >= 0 && gx < data.width && gy >= 0 && gy < data.height) {
        flat[gy * data.width + gx] = 1;
      }
    }
    collisionGrid = new CollisionGrid(data.width, data.height, flat);
  }

  const tileset = data.tilesets?.[0];
  const firstGid = tileset?.firstgid ?? 1;
  const tilesetSource = tileset?.source ? stripExtension(tileset.source) : "main";

  return {
    width: data.width,
    height: data.height,
    tileWidth: data.tilewidth,
    tileHeight: data.tileheight,
    groundData,
    detailDownData,
    detailUpData,
    collisionGrid,
    spawns,
    npcs,
    interactables,
    transitions,
    firstGid,
    tilesetSource
  };
}

function findTileLayer(
  layers: TiledLayer[],
  name: string
): TiledLayer | undefined {
  return layers.find((l) => l.name === name && l.type === "tilelayer");
}

function findObjectLayer(
  layers: TiledLayer[],
  name: string
): TiledLayer | undefined {
  return layers.find((l) => l.name === name && l.type === "objectgroup");
}

function getProp(obj: TiledObject, name: string, fallback: string): string {
  const p = obj.properties?.find((x: TiledProperty) => x.name === name);
  return p ? String(p.value) : fallback;
}

function getOptionalProp(obj: TiledObject, name: string): string | undefined {
  const p = obj.properties?.find((x: TiledProperty) => x.name === name);
  return p ? String(p.value) : undefined;
}

function stripExtension(path: string): string {
  return path.replace(/\.[^.]+$/, "");
}
