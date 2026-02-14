import { MapSchema, Schema, type } from "@colyseus/schema";

const WORLD_WIDTH_TILES = 32;
const WORLD_HEIGHT_TILES = 32;

export class TileSchema extends Schema {
  @type("string") declare kind: string;
  @type("boolean") declare tilled: boolean;
  @type("boolean") declare watered: boolean;
  @type("boolean") declare hasCrop: boolean;
  @type("uint8") declare objectHealth: number;
}

export class PlayerSchema extends Schema {
  @type("string") declare id: string;
  @type("uint16") declare gridX: number;
  @type("uint16") declare gridY: number;
  @type("uint16") declare stamina: number;
  @type("uint16") declare maxStamina: number;
  @type("uint8") declare selectedHotbarSlot: number;
  @type("uint32") declare lastInteractAtMs: number;
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
  @type("string") declare classroomId: string;

  constructor(classroomId: string) {
    super();
    this.classroomId = classroomId;
    this.players = new MapSchema<PlayerSchema>();
    this.tiles = new MapSchema<TileSchema>();
    initializeWorldTiles(this.tiles);
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
      tile.objectHealth = 0;

      const seed = (gridX * 31 + gridY * 17) % 20;
      if (seed === 0 || seed === 1) {
        tile.kind = "tree";
        tile.objectHealth = 4;
      } else if (seed === 2 || seed === 3) {
        tile.kind = "rock";
        tile.objectHealth = 3;
      } else if (seed >= 4 && seed <= 9) {
        tile.kind = "tilled_soil";
        tile.tilled = true;
      }
      tiles.set(`${gridX},${gridY}`, tile);
    }
  }
}
