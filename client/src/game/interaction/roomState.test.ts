import { describe, expect, it } from "vitest";
import { diffRemotePlayers, readPlayerSnapshots } from "./roomState.js";

describe("readPlayerSnapshots", () => {
  it("returns empty array when room is null", () => {
    expect(readPlayerSnapshots(null)).toEqual([]);
  });

  it("returns empty array when room is undefined", () => {
    expect(readPlayerSnapshots(undefined)).toEqual([]);
  });

  it("reads player snapshots from map-like room state", () => {
    const players = new Map<string, { currentMapKey: string; gridX: number; gridY: number }>([
      ["a", { currentMapKey: "parsedMap_village", gridX: 1, gridY: 2 }],
      ["b", { currentMapKey: "parsedMap_village", gridX: 3, gridY: 4 }]
    ]);
    const snapshots = readPlayerSnapshots({ state: { players } });
    expect(snapshots).toEqual([
      { sessionId: "a", currentMapKey: "parsedMap_village", gridX: 1, gridY: 2 },
      { sessionId: "b", currentMapKey: "parsedMap_village", gridX: 3, gridY: 4 }
    ]);
  });
});

describe("diffRemotePlayers", () => {
  it("creates upserts/removals excluding local player", () => {
    const result = diffRemotePlayers(
      [
        { sessionId: "local", currentMapKey: "parsedMap_village", gridX: 1, gridY: 1 },
        { sessionId: "remote-a", currentMapKey: "parsedMap_village", gridX: 2, gridY: 2 },
        { sessionId: "remote-b", currentMapKey: "parsedMap_elders_house", gridX: 5, gridY: 5 }
      ],
      "local",
      "parsedMap_village",
      ["stale-id"]
    );
    expect(result.upserts).toEqual([
      { sessionId: "remote-a", currentMapKey: "parsedMap_village", gridX: 2, gridY: 2 }
    ]);
    expect(result.removals).toEqual(["stale-id"]);
  });
});
