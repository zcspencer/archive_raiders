import { MapSchema, Schema, type } from "@colyseus/schema";

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
 * Key for world objects map: "gridX,gridY".
 */
export function worldObjectKey(gridX: number, gridY: number): string {
  return `${gridX},${gridY}`;
}

/**
 * Populates state.worldObjects with tree/rock objects using the same seed-based placement as before.
 * getHealth must return the max health for the given definition ID (from Destroyable component).
 */
export function initializeWorldObjects(
  worldObjects: MapSchema<WorldObjectSchema>,
  getHealth: (definitionId: string) => number | undefined
): void {
  for (let gridX = 0; gridX < WORLD_WIDTH_TILES; gridX += 1) {
    for (let gridY = 0; gridY < WORLD_HEIGHT_TILES; gridY += 1) {
      const seed = (gridX * 31 + gridY * 17) % 20;
      let definitionId: string | undefined;
      if (seed === 0 || seed === 1) {
        definitionId = "tree";
      } else if (seed === 2 || seed === 3) {
        definitionId = "rock";
      }
      if (!definitionId) continue;
      const maxHealth = getHealth(definitionId);
      if (maxHealth === undefined || maxHealth <= 0) continue;
      const obj = new WorldObjectSchema();
      obj.objectId = worldObjectKey(gridX, gridY);
      obj.definitionId = definitionId;
      obj.gridX = gridX;
      obj.gridY = gridY;
      obj.health = maxHealth;
      obj.maxHealth = maxHealth;
      worldObjects.set(obj.objectId, obj);
    }
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
