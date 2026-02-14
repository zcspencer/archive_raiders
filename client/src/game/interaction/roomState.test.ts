import { describe, expect, it } from "vitest";
import { diffRemotePlayers, readPlayerSnapshots } from "./roomState.js";

describe("readPlayerSnapshots", () => {
  it("reads player snapshots from map-like room state", () => {
    const players = new Map<string, { gridX: number; gridY: number }>([
      ["a", { gridX: 1, gridY: 2 }],
      ["b", { gridX: 3, gridY: 4 }]
    ]);
    const snapshots = readPlayerSnapshots({ state: { players } });
    expect(snapshots).toEqual([
      { sessionId: "a", gridX: 1, gridY: 2 },
      { sessionId: "b", gridX: 3, gridY: 4 }
    ]);
  });
});

describe("diffRemotePlayers", () => {
  it("creates upserts/removals excluding local player", () => {
    const result = diffRemotePlayers(
      [
        { sessionId: "local", gridX: 1, gridY: 1 },
        { sessionId: "remote-a", gridX: 2, gridY: 2 }
      ],
      "local",
      ["stale-id"]
    );
    expect(result.upserts).toEqual([{ sessionId: "remote-a", gridX: 2, gridY: 2 }]);
    expect(result.removals).toEqual(["stale-id"]);
  });
});
