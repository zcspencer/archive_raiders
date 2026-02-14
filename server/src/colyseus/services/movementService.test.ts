import { describe, expect, it } from "vitest";
import type { PlayerSchema } from "../schema/ShardState.js";
import { applyMove } from "./movementService.js";

function createPlayerState(): PlayerSchema {
  return {
    id: "p1",
    gridX: 10,
    gridY: 10,
    stamina: 100,
    maxStamina: 100,
    equippedToolId: "axe",
    selectedHotbarSlot: 0,
    axeLevel: 0,
    wateringCanLevel: 0,
    seedsLevel: 0,
    lastInteractAtMs: 0
  } as PlayerSchema;
}

describe("applyMove", () => {
  it("clamps coordinates to world bounds", () => {
    const player = createPlayerState();
    applyMove(player, { gridX: 999, gridY: -50 });
    expect(player.gridX).toBe(31);
    expect(player.gridY).toBe(0);
  });
});
