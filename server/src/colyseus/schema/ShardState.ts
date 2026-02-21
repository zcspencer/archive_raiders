import { MapSchema, Schema, type } from "@colyseus/schema";
import type { MapWorldObjectPlacement } from "@odyssey/shared";

const WORLD_WIDTH_TILES = 32;
const WORLD_HEIGHT_TILES = 32;

export class TileSchema extends Schema {
  @type("string") declare kind: string;
  @type("boolean") declare tilled: boolean;
  @type("boolean") declare watered: boolean;
  @type("boolean") declare hasCrop: boolean;
}

export class WorldObjectSchema extends Schema {
  @type("string") declare objectId: string;
  @type("string") declare mapKey: string;
  @type("string") declare definitionId: string;
  @type("uint16") declare gridX: number;
  @type("uint16") declare gridY: number;
  @type("uint16") declare health: number;
  @type("uint16") declare maxHealth: number;
}

export class PlayerSchema extends Schema {
  @type("string") declare id: string;
  @type("string") declare currentMapKey: string;
  @type("uint16") declare gridX: number;
  @type("uint16") declare gridY: number;
  @type("uint16") declare stamina: number;
  @type("uint16") declare maxStamina: number;
  @type("uint32") declare lastAttackAtMs: number;
  /** Inventory instance ID in hand slot; empty string = none. */
  @type("string") declare equippedHandItemId: string;
  /** Inventory instance ID in head slot; empty string = none. */
  @type("string") declare equippedHeadItemId: string;
  /** Definition ID for hand (for remote clients that don't have inventory). */
  @type("string") declare equippedHandDefId: string;
  /** Definition ID for head (for remote clients). */
  @type("string") declare equippedHeadDefId: string;
}

export class ShardState extends Schema {
  @type({ map: PlayerSchema }) declare players: MapSchema<PlayerSchema>;
  @type({ map: TileSchema }) declare tiles: MapSchema<TileSchema>;
  @type({ map: WorldObjectSchema }) declare worldObjects: MapSchema<WorldObjectSchema>;
  @type("string") declare classroomId: string;

  constructor(classroomId: string) {
    super();
    this.classroomId = classroomId;
    this.players = new MapSchema<PlayerSchema>();
    this.tiles = new MapSchema<TileSchema>();
    this.worldObjects = new MapSchema<WorldObjectSchema>();
    initializeWorldTiles(this.tiles);
  }
}

/**
 * Composite key for the worldObjects map: "mapKey:gridX,gridY".
 */
export function worldObjectKey(mapKey: string, gridX: number, gridY: number): string {
  return `${mapKey}:${gridX},${gridY}`;
}

/**
 * Spawns world objects for a single map from explicit placements (Tiled or procedural).
 * @param getHealth resolves max health from item definition Destroyable component.
 */
export function spawnWorldObjectsForMap(
  worldObjects: MapSchema<WorldObjectSchema>,
  mapKey: string,
  placements: MapWorldObjectPlacement[],
  getHealth: (definitionId: string) => number | undefined
): void {
  for (const p of placements) {
    const maxHealth = getHealth(p.definition_id);
    if (maxHealth === undefined || maxHealth <= 0) continue;
    const key = worldObjectKey(mapKey, p.gridX, p.gridY);
    const obj = new WorldObjectSchema();
    obj.objectId = key;
    obj.mapKey = mapKey;
    obj.definitionId = p.definition_id;
    obj.gridX = p.gridX;
    obj.gridY = p.gridY;
    obj.health = maxHealth;
    obj.maxHealth = maxHealth;
    worldObjects.set(key, obj);
  }
}

function initializeWorldTiles(tiles: MapSchema<TileSchema>): void {
  for (let gridX = 0; gridX < WORLD_WIDTH_TILES; gridX += 1) {
    for (let gridY = 0; gridY < WORLD_HEIGHT_TILES; gridY += 1) {
      const tile = new TileSchema();
      tile.kind = "grass";
      tile.tilled = false;
      tile.watered = false;
      tile.hasCrop = false;

      const seed = (gridX * 31 + gridY * 17) % 20;
      if (seed >= 4 && seed <= 9) {
        tile.kind = "tilled_soil";
        tile.tilled = true;
      }
      tiles.set(`${gridX},${gridY}`, tile);
    }
  }
}
