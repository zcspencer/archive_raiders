import { describe, expect, it } from "vitest";
import { worldToTile } from "./tileProjection.js";

describe("worldToTile", () => {
  it("projects world coordinates to tile coordinates", () => {
    const tile = worldToTile(95, 64);
    expect(tile.gridX).toBe(2);
    expect(tile.gridY).toBe(2);
  });
});
