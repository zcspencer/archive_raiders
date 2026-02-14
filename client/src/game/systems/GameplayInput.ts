import Phaser from "phaser";
import { isFormFieldFocused } from "../input/formFocus";
import { usePlayerControlStore } from "../../store/playerControl";
import { useDialogueStore } from "../../store/dialogue";
import { useChestStore } from "../../store/chest";

/**
 * Standard WASD + interact key bindings used by gameplay scenes.
 */
export interface GameplayKeys {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  interact: Phaser.Input.Keyboard.Key;
}

/**
 * Sets up keyboard input for a gameplay scene and exposes key state.
 */
export class GameplayInput {
  readonly keys: GameplayKeys;

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) throw new Error("Keyboard input unavailable");

    this.keys = keyboard.addKeys({
      left: "A",
      right: "D",
      up: "W",
      down: "S",
      interact: "X"
    }) as GameplayKeys;

    keyboard.addCapture?.("W,S,A,D,X");

    const canvas = scene.game.canvas as HTMLCanvasElement | null;
    if (canvas?.setAttribute) canvas.setAttribute("tabindex", "0");
    scene.input.mouse?.disableContextMenu();
  }

  /**
   * Returns true when the player should not move or interact.
   * Checks input mode, form focus, dialogue, and open chest UI.
   */
  isBlocked(): boolean {
    const controlState = usePlayerControlStore.getState();
    const dialogueActive = useDialogueStore.getState().isActive;
    const chestOpen = useChestStore.getState().currentChestId !== null;
    return (
      controlState.inputMode !== "game" ||
      isFormFieldFocused(document.activeElement) ||
      dialogueActive ||
      chestOpen
    );
  }

  /** Returns true when the interact key was just pressed this frame. */
  justPressedInteract(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.keys.interact);
  }
}
