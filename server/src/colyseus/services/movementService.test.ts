import { describe, expect, it } from "vitest";
import type { PlayerSchema } from "../schema/ShardState.js";
import { applyMove } from "./movementService.js";

function createPlayerState(overrides?: Partial<PlayerSchema>): PlayerSchema {
  return {
    id: "p1",
    gridX: 10,
    gridY: 10,
    stamina: 100,
    maxStamina: 100,
    equippedHandItemId: "",
    equippedHeadItemId: "",
    equippedHandDefId: "",
    equippedHeadDefId: "",
    ...overrides
  } as PlayerSchema;
}

describe("applyMove", () => {
  it("clamps coordinates to world bounds", () => {
    const player = createPlayerState();
    applyMove(player, { gridX: 999, gridY: -50 });
    expect(player.gridX).toBe(31);
    expect(player.gridY).toBe(0);
  });

  it("rejects move into a blocked tile", () => {
    const player = createPlayerState();
    const blocked = new Set(["11,10"]);
    applyMove(player, { gridX: 11, gridY: 10 }, (gx, gy) => blocked.has(`${gx},${gy}`));
    expect(player.gridX).toBe(10);
    expect(player.gridY).toBe(10);
  });

  it("allows move into an unblocked tile", () => {
    const player = createPlayerState();
    const blocked = new Set(["5,5"]);
    applyMove(player, { gridX: 11, gridY: 10 }, (gx, gy) => blocked.has(`${gx},${gy}`));
    expect(player.gridX).toBe(11);
    expect(player.gridY).toBe(10);
  });

  it("allows move when no blocker is provided", () => {
    const player = createPlayerState();
    applyMove(player, { gridX: 15, gridY: 15 });
    expect(player.gridX).toBe(15);
    expect(player.gridY).toBe(15);
  });
});
