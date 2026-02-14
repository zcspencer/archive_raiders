import { describe, expect, it } from "vitest";
import type { TiledMapData } from "@odyssey/shared";
import { parseMap } from "./TileMapManager.js";

const MINIMAL_MAP: TiledMapData = {
  width: 3,
  height: 3,
  tilewidth: 32,
  tileheight: 32,
  layers: [
    {
      name: "ground",
      type: "tilelayer",
      width: 3,
      height: 3,
      visible: true,
      data: [1, 1, 1, 1, 2, 1, 1, 1, 1]
    },
    {
      name: "collision",
      type: "tilelayer",
      width: 3,
      height: 3,
      visible: false,
      data: [1, 1, 1, 1, 0, 1, 1, 1, 1]
    },
    {
      name: "objects",
      type: "objectgroup",
      visible: true,
      objects: [
        {
          id: 1,
          name: "test_npc",
          type: "npc",
          x: 32,
          y: 32,
          width: 32,
          height: 32,
          properties: [{ name: "npcId", type: "string", value: "test_npc" }]
        },
        {
          id: 2,
          name: "test_chest",
          type: "interactable",
          x: 64,
          y: 64,
          width: 32,
          height: 32,
          properties: [
            { name: "objectId", type: "string", value: "test_chest" },
            { name: "kind", type: "string", value: "chest" },
            { name: "label", type: "string", value: "Test Chest" }
          ]
        },
        {
          id: 3,
          name: "spawn",
          type: "spawn",
          x: 32,
          y: 64,
          width: 32,
          height: 32,
          properties: []
        }
      ]
    }
  ]
};

describe("parseMap", () => {
  it("extracts ground data", () => {
    const result = parseMap(MINIMAL_MAP);
    expect(result.groundData).toEqual([1, 1, 1, 1, 2, 1, 1, 1, 1]);
  });

  it("builds a collision grid", () => {
    const result = parseMap(MINIMAL_MAP);
    expect(result.collisionGrid.isWalkable(1, 1)).toBe(true);
    expect(result.collisionGrid.isWalkable(0, 0)).toBe(false);
  });

  it("extracts NPC placements from object layer", () => {
    const result = parseMap(MINIMAL_MAP);
    expect(result.npcs).toEqual([{ npcId: "test_npc", gridX: 1, gridY: 1 }]);
  });

  it("extracts interactable object placements", () => {
    const result = parseMap(MINIMAL_MAP);
    expect(result.objects).toEqual([
      { objectId: "test_chest", kind: "chest", label: "Test Chest", gridX: 2, gridY: 2 }
    ]);
  });

  it("extracts player spawn point", () => {
    const result = parseMap(MINIMAL_MAP);
    expect(result.playerSpawn).toEqual({ gridX: 1, gridY: 2 });
  });

  it("returns map dimensions", () => {
    const result = parseMap(MINIMAL_MAP);
    expect(result.width).toBe(3);
    expect(result.height).toBe(3);
    expect(result.tileSize).toBe(32);
  });
});
