import { describe, expect, it } from "vitest";
import { CollisionGrid } from "./collisionGrid.js";

describe("CollisionGrid", () => {
  // 3x3 grid: border is blocked (1), center is walkable (0)
  const data = [
    1, 1, 1,
    1, 0, 1,
    1, 1, 1
  ];

  it("reports walkable tile as walkable", () => {
    const grid = new CollisionGrid(3, 3, data);
    expect(grid.isWalkable(1, 1)).toBe(true);
  });

  it("reports blocked tile as not walkable", () => {
    const grid = new CollisionGrid(3, 3, data);
    expect(grid.isWalkable(0, 0)).toBe(false);
    expect(grid.isWalkable(2, 2)).toBe(false);
  });

  it("treats negative coordinates as blocked", () => {
    const grid = new CollisionGrid(3, 3, data);
    expect(grid.isWalkable(-1, 0)).toBe(false);
    expect(grid.isWalkable(0, -1)).toBe(false);
  });

  it("treats out-of-bounds coordinates as blocked", () => {
    const grid = new CollisionGrid(3, 3, data);
    expect(grid.isWalkable(3, 0)).toBe(false);
    expect(grid.isWalkable(0, 3)).toBe(false);
    expect(grid.isWalkable(100, 100)).toBe(false);
  });

  it("returns correct width and height", () => {
    const grid = new CollisionGrid(3, 3, data);
    expect(grid.getWidth()).toBe(3);
    expect(grid.getHeight()).toBe(3);
  });

  it("handles all-walkable grid", () => {
    const allOpen = [0, 0, 0, 0];
    const grid = new CollisionGrid(2, 2, allOpen);
    expect(grid.isWalkable(0, 0)).toBe(true);
    expect(grid.isWalkable(1, 1)).toBe(true);
  });

  it("handles all-blocked grid", () => {
    const allBlocked = [1, 1, 1, 1];
    const grid = new CollisionGrid(2, 2, allBlocked);
    expect(grid.isWalkable(0, 0)).toBe(false);
    expect(grid.isWalkable(1, 1)).toBe(false);
  });
});
