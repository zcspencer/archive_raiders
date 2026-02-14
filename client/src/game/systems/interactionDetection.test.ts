import { describe, expect, it } from "vitest";
import { findInteractionTarget } from "./interactionDetection.js";

/* Minimal stubs matching the entity interfaces used by findInteractionTarget. */
function stubNpc(npcId: string, gx: number, gy: number) {
  return {
    npcId,
    gridX: gx,
    gridY: gy,
    isPlayerFacing: (px: number, py: number, fx: number, fy: number) =>
      px + fx === gx && py + fy === gy,
    isPlayerAdjacent: (px: number, py: number) =>
      Math.abs(px - gx) + Math.abs(py - gy) === 1,
    body: {} as never,
    label: {} as never,
    destroy: () => {}
  };
}

function stubObject(objectId: string, kind: string, gx: number, gy: number) {
  return {
    objectId,
    kind,
    gridX: gx,
    gridY: gy,
    isPlayerFacing: (px: number, py: number, fx: number, fy: number) =>
      px + fx === gx && py + fy === gy,
    body: {} as never,
    label: {} as never,
    destroy: () => {}
  };
}

describe("findInteractionTarget", () => {
  it("returns NPC when player faces it", () => {
    const npc = stubNpc("elder", 5, 3);
    const result = findInteractionTarget([npc], [], 5, 4, 0, -1);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("npc");
  });

  it("returns object when player faces it", () => {
    const obj = stubObject("chest1", "chest", 3, 3);
    const result = findInteractionTarget([], [obj], 2, 3, 1, 0);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("object");
  });

  it("returns null when player faces empty tile", () => {
    const npc = stubNpc("elder", 5, 3);
    const result = findInteractionTarget([npc], [], 1, 1, 0, 1);
    expect(result).toBeNull();
  });

  it("prioritizes NPC over object at same position", () => {
    const npc = stubNpc("elder", 5, 3);
    const obj = stubObject("sign", "sign", 5, 3);
    const result = findInteractionTarget([npc], [obj], 5, 4, 0, -1);
    expect(result!.type).toBe("npc");
  });

  it("returns null with empty entity lists", () => {
    const result = findInteractionTarget([], [], 5, 5, 1, 0);
    expect(result).toBeNull();
  });
});
