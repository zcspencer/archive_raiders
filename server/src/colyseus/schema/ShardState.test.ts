import { describe, expect, it } from "vitest";
import { ShardState } from "./ShardState.js";

describe("ShardState world initialization", () => {
  it("creates seeded authoritative tiles", () => {
    const state = new ShardState("classroom-1");
    expect(state.tiles.size).toBe(32 * 32);
    expect(state.tiles.get("0,0")).toBeDefined();
  });
});
