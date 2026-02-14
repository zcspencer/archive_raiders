import type { Npc } from "../entities/Npc";
import type { InteractableObject } from "../entities/InteractableObject";

/**
 * Result of an interaction query.
 */
export type InteractionTarget =
  | { type: "npc"; entity: Npc }
  | { type: "object"; entity: InteractableObject }
  | null;

/**
 * Checks NPCs and interactable objects for interaction. For NPCs: returns
 * the one the player is facing, or the first adjacent NPC if none are faced.
 * For objects: requires the player to be facing the object.
 *
 * @param npcs    - Active NPC list.
 * @param objects - Active interactable object list.
 * @param px      - Player grid X.
 * @param py      - Player grid Y.
 * @param fx      - Player facing X (-1, 0, or 1).
 * @param fy      - Player facing Y (-1, 0, or 1).
 */
export function findInteractionTarget(
  npcs: readonly Npc[],
  objects: readonly InteractableObject[],
  px: number,
  py: number,
  fx: number,
  fy: number
): InteractionTarget {
  for (const npc of npcs) {
    if (npc.isPlayerFacing(px, py, fx, fy)) {
      return { type: "npc", entity: npc };
    }
  }

  for (const npc of npcs) {
    if (npc.isPlayerAdjacent(px, py)) {
      return { type: "npc", entity: npc };
    }
  }

  for (const obj of objects) {
    if (obj.isPlayerFacing(px, py, fx, fy)) {
      return { type: "object", entity: obj };
    }
  }

  return null;
}
