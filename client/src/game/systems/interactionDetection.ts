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
 * Checks all NPCs and interactable objects to find the one the player
 * is currently facing. Returns the first match or null.
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

  for (const obj of objects) {
    if (obj.isPlayerFacing(px, py, fx, fy)) {
      return { type: "object", entity: obj };
    }
  }

  return null;
}
