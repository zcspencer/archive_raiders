import { describe, expect, it } from "vitest";
import { getFacingInteractionTile, getMovementVector } from "./movementIntent.js";

describe("movement intent", () => {
  it("normalizes diagonal movement", () => {
    const vector = getMovementVector(false, true, false, true);
    expect(vector.x).toBeCloseTo(0.7071, 3);
    expect(vector.y).toBeCloseTo(0.7071, 3);
  });

  it("builds facing interaction tile", () => {
    const tile = getFacingInteractionTile(10, 20, -1, 0);
    expect(tile.x).toBe(9);
    expect(tile.y).toBe(20);
  });
});
