import Phaser from "phaser";
import { TILE_SIZE } from "@odyssey/shared";

const KIND_COLORS: Record<string, number> = {
  chest: 0xfbbf24,
  door: 0x8b5cf6,
  transition: 0x8b5cf6,
  artifact: 0x06b6d4,
  sign: 0x94a3b8,
  computer: 0x22c55e
};

/** Default prompt text per object kind. */
const KIND_PROMPTS: Record<string, string> = {
  chest: "X to open",
  door: "X to enter",
  transition: "X to enter",
  artifact: "X to examine",
  sign: "X to read",
  computer: "X to use"
};

const LABEL_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontSize: "10px",
  color: "#ffffff",
  align: "center"
};

const PROMPT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontSize: "11px",
  color: "#a3e635",
  align: "center",
  fontStyle: "bold"
};

/**
 * An interactable object placed on a map (chest, door, artifact, sign).
 * Shows a proximity prompt when the player is adjacent.
 */
export class InteractableObject {
  readonly objectId: string;
  readonly kind: string;
  readonly gridX: number;
  readonly gridY: number;
  /** Optional task definition ID that gates this interaction behind a challenge. */
  readonly taskId: string | undefined;
  /** Data-driven transition target; when set, kind is typically "transition" or "door". */
  readonly transitionDestinationMap?: string;
  readonly transitionDestinationSpawn?: string;
  readonly body: Phaser.GameObjects.Rectangle;
  readonly label: Phaser.GameObjects.Text;
  readonly prompt: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    objectId: string,
    kind: string,
    labelText: string,
    gridX: number,
    gridY: number,
    taskId?: string,
    transitionDestinationMap?: string,
    transitionDestinationSpawn?: string
  ) {
    this.objectId = objectId;
    this.kind = kind;
    this.transitionDestinationMap = transitionDestinationMap;
    this.transitionDestinationSpawn = transitionDestinationSpawn;
    this.gridX = gridX;
    this.gridY = gridY;
    this.taskId = taskId;

    const worldX = gridX * TILE_SIZE + TILE_SIZE / 2;
    const worldY = gridY * TILE_SIZE + TILE_SIZE / 2;
    const color = KIND_COLORS[kind] ?? 0x94a3b8;

    this.body = scene.add.rectangle(worldX, worldY, 20, 20, color);
    this.body.setDepth(1);

    this.label = scene.add.text(worldX, worldY - 16, labelText, LABEL_STYLE);
    this.label.setOrigin(0.5, 1);
    this.label.setDepth(2);

    const promptText = KIND_PROMPTS[kind] ?? "X to interact";
    this.prompt = scene.add.text(worldX, worldY - 30, promptText, PROMPT_STYLE);
    this.prompt.setOrigin(0.5, 1);
    this.prompt.setDepth(2);
    this.prompt.setVisible(false);
  }

  /** Shows or hides the interaction prompt. */
  setInteractionPromptVisible(visible: boolean): void {
    this.prompt.setVisible(visible);
  }

  /**
   * Returns true if the player at (px, py) is adjacent to this object
   * (within one tile in any cardinal direction).
   */
  isPlayerAdjacent(px: number, py: number): boolean {
    const dx = Math.abs(px - this.gridX);
    const dy = Math.abs(py - this.gridY);
    return (dx + dy) === 1;
  }

  /**
   * Returns true if the player at (px, py) facing (fx, fy) is
   * looking directly at this object.
   */
  isPlayerFacing(px: number, py: number, fx: number, fy: number): boolean {
    return (px + fx) === this.gridX && (py + fy) === this.gridY;
  }

  /** Removes the object game objects from the scene. */
  destroy(): void {
    this.body.destroy();
    this.label.destroy();
    this.prompt.destroy();
  }
}
