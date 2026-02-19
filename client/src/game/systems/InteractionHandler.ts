import type { Npc } from "../entities/Npc";
import type { InteractableObject } from "../entities/InteractableObject";
import { findInteractionTarget } from "./interactionDetection";
import { getNpcDialogue, getNpcDefinition } from "../content/npcDialogue";
import { useDialogueStore } from "../../store/dialogue";
import { usePlayerControlStore } from "../../store/playerControl";
import { useGameRoomBridgeStore } from "../../store/gameRoomBridge";
import { useContainerStore } from "../../store/container";
import { useChallengeStore } from "../../store/challenge";
import { getTaskDefinition } from "../../data/taskDefinitions";

/** Callback a scene provides so the handler can trigger scene transitions. */
export type SceneTransitionFn = (targetScene: string, data: Record<string, unknown>) => void;

/**
 * Coordinates what happens when the player presses the interact key.
 * Delegates NPC dialogue, chest opening, and door scene transitions
 * so scenes stay thin orchestrators.
 */
export class InteractionHandler {
  private readonly onSceneTransition: SceneTransitionFn;

  constructor(onSceneTransition: SceneTransitionFn) {
    this.onSceneTransition = onSceneTransition;
  }

  /**
   * Finds the interaction target and performs the appropriate action.
   *
   * @param npcs    - Active NPC list.
   * @param objects - Active interactable object list.
   * @param px      - Player grid X.
   * @param py      - Player grid Y.
   * @param fx      - Player facing X.
   * @param fy      - Player facing Y.
   */
  handle(
    npcs: readonly Npc[],
    objects: readonly InteractableObject[],
    px: number,
    py: number,
    fx: number,
    fy: number
  ): void {
    const target = findInteractionTarget(npcs, objects, px, py, fx, fy);
    if (!target) return;

    if (target.type === "npc") {
      this.handleNpc(target.entity);
      return;
    }

    if (target.type === "object") {
      this.handleObject(target.entity);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Private helpers                                                    */
  /* ------------------------------------------------------------------ */

  private handleNpc(npc: Npc): void {
    const lines = getNpcDialogue(npc.npcId);
    if (lines.length > 0) {
      const def = getNpcDefinition(npc.npcId);
      useDialogueStore.getState().openDialogue(def?.displayName ?? npc.npcId, lines);
      usePlayerControlStore.getState().setInputMode("ui");
    }
  }

  private handleObject(obj: InteractableObject): void {
    if (obj.taskId) {
      const task = getTaskDefinition(obj.taskId);
      if (task) {
        useChallengeStore.getState().startChallenge(task, () => {
          this.proceedWithObject(obj);
        });
        usePlayerControlStore.getState().setInputMode("ui");
        return;
      }
    }
    this.proceedWithObject(obj);
  }

  /** Executes the actual interaction after any challenge gate has passed. */
  private proceedWithObject(obj: InteractableObject): void {
    if (obj.kind === "door" || obj.kind === "transition") {
      this.handleDoor(obj);
      return;
    }

    if (obj.kind === "chest") {
      this.handleChest(obj);
      return;
    }

    /* Standalone challenge objects (computer, artifact with taskId) are
       fully handled by the challenge panel — nothing else to do here. */
    if (obj.taskId) return;

    /* Fallback for unknown kinds — log for debugging. */
    console.log(`Interacted with ${obj.kind}: ${obj.objectId}`);
  }

  private handleDoor(obj: InteractableObject): void {
    if (obj.transitionDestinationMap) {
      this.onSceneTransition("TiledMapScene", {
        mapKey: `parsedMap_${obj.transitionDestinationMap}`,
        spawnName: obj.transitionDestinationSpawn ?? undefined
      });
    }
  }

  private handleChest(obj: InteractableObject): void {
    useContainerStore.getState().setOpening(obj.objectId);
    useGameRoomBridgeStore.getState().sendOpenContainer(obj.objectId);
    usePlayerControlStore.getState().setInputMode("ui");
  }
}
