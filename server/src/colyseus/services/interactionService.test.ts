import { describe, expect, it } from "vitest";
import { MapSchema } from "@colyseus/schema";
import { TileSchema, type PlayerSchema } from "../schema/ShardState.js";
import { applyInteraction } from "./interactionService.js";

function createPlayerState(): PlayerSchema {
  return {
    id: "p1",
    gridX: 10,
    gridY: 10,
    stamina: 100,
    maxStamina: 100,
    selectedHotbarSlot: 0,
    lastInteractAtMs: 0,
    equippedHandItemId: "",
    equippedHeadItemId: "",
    equippedHandDefId: "",
    equippedHeadDefId: ""
  } as PlayerSchema;
}

describe("applyInteraction", () => {
  it("accepts valid axe interaction when hand has chop stat, spends stamina, and mutates tile", () => {
    const player = createPlayerState();
    const tiles = createTiles();
    const result = applyInteraction(
      player,
      tiles,
      {
        target: { gridX: 0, gridY: 0 },
        toolId: "axe",
        actionType: "primary",
        chargeMs: 0
      },
      250,
      { chop: 1 }
    );
    expect(result.accepted).toBe(true);
    expect(player.stamina).toBeLessThan(100);
    const tile = tiles.get("0,0");
    expect(tile?.objectHealth).toBe(2);
  });

  it("rejects when hand lacks required stat for the action", () => {
    const player = createPlayerState();
    const tiles = createTiles();
    const result = applyInteraction(
      player,
      tiles,
      {
        target: { gridX: 0, gridY: 0 },
        toolId: "seeds",
        actionType: "primary",
        chargeMs: 0
      },
      250,
      undefined
    );
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("Unsupported tool or wrong equipment");
  });

  it("plants crop on tilled tile when hand has plant stat", () => {
    const player = createPlayerState();
    const tiles = createTiles();
    const result = applyInteraction(
      player,
      tiles,
      {
        target: { gridX: 1, gridY: 1 },
        toolId: "seeds",
        actionType: "primary",
        chargeMs: 0
      },
      250,
      { plant: 1 }
    );
    expect(result.accepted).toBe(true);
    expect(tiles.get("1,1")?.hasCrop).toBe(true);
  });
});

function createTiles(): MapSchema<TileSchema> {
  const tiles = new MapSchema<TileSchema>();
  const treeTile = new TileSchema();
  treeTile.kind = "tree";
  treeTile.objectHealth = 3;
  treeTile.tilled = false;
  treeTile.hasCrop = false;
  treeTile.watered = false;
  tiles.set("0,0", treeTile);

  const soilTile = new TileSchema();
  soilTile.kind = "tilled_soil";
  soilTile.objectHealth = 0;
  soilTile.tilled = true;
  soilTile.hasCrop = false;
  soilTile.watered = false;
  tiles.set("1,1", soilTile);
  return tiles;
}
