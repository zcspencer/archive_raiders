import type { Npc } from "../entities/Npc";
import type { InteractableObject } from "../entities/InteractableObject";
import { findInteractionTarget } from "./interactionDetection";
import { getNpcDialogue, getNpcDefinition } from "../content/npcDialogue";
import { useDialogueStore } from "../../store/dialogue";
import { usePlayerControlStore } from "../../store/playerControl";
import { useGameRoomBridgeStore } from "../../store/gameRoomBridge";
import { useContainerStore } from "../../store/container";

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
    if (obj.kind === "door") {
      this.handleDoor(obj);
      return;
    }

    if (obj.kind === "chest") {
      this.handleChest(obj);
      return;
    }

    /* Fallback for unknown kinds — log for debugging. */
    console.log(`Interacted with ${obj.kind}: ${obj.objectId}`);
  }

  private handleDoor(obj: InteractableObject): void {
    const transitions = doorTransitions[obj.objectId];
    if (transitions) {
      this.onSceneTransition(transitions.targetScene, transitions.data);
    }
  }

  private handleChest(obj: InteractableObject): void {
    useContainerStore.getState().setOpening(obj.objectId);
    useGameRoomBridgeStore.getState().sendOpenContainer(obj.objectId);
    usePlayerControlStore.getState().setInputMode("ui");
  }
}

/* ------------------------------------------------------------------ */
/*  Door transition table                                              */
/* ------------------------------------------------------------------ */

interface DoorTransition {
  targetScene: string;
  data: Record<string, unknown>;
}

/** Static mapping from door objectId to scene transition details. */
const doorTransitions: Record<string, DoorTransition> = {
  elder_house_door: {
    targetScene: "EldersHouseScene",
    data: { mapKey: "parsedMap_elders_house" }
  },
  mosslight_cottage_door: {
    targetScene: "MosslightCottageScene",
    data: { mapKey: "parsedMap_mosslight_cottage" }
  },
  timber_nook_door: {
    targetScene: "TimberNookScene",
    data: { mapKey: "parsedMap_timber_nook" }
  },
  elders_house_exit: {
    targetScene: "VillageScene",
    data: { mapKey: "parsedMap_village", spawnGridX: 4, spawnGridY: 7 }
  },
  mosslight_cottage_exit: {
    targetScene: "VillageScene",
    data: { mapKey: "parsedMap_village", spawnGridX: 13, spawnGridY: 7 }
  },
  timber_nook_exit: {
    targetScene: "VillageScene",
    data: { mapKey: "parsedMap_village", spawnGridX: 13, spawnGridY: 15 }
  }
};
