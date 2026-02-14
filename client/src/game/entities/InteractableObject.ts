import Phaser from "phaser";
import { TILE_SIZE } from "@odyssey/shared";

const KIND_COLORS: Record<string, number> = {
  chest: 0xfbbf24,
  door: 0x8b5cf6,
  artifact: 0x06b6d4,
  sign: 0x94a3b8
};

const LABEL_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontSize: "10px",
  color: "#ffffff",
  align: "center"
};

/**
 * An interactable object placed on the village map (chest, door, artifact, sign).
 */
export class InteractableObject {
  readonly objectId: string;
  readonly kind: string;
  readonly gridX: number;
  readonly gridY: number;
  readonly body: Phaser.GameObjects.Rectangle;
  readonly label: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    objectId: string,
    kind: string,
    labelText: string,
    gridX: number,
    gridY: number
  ) {
    this.objectId = objectId;
    this.kind = kind;
    this.gridX = gridX;
    this.gridY = gridY;

    const worldX = gridX * TILE_SIZE + TILE_SIZE / 2;
    const worldY = gridY * TILE_SIZE + TILE_SIZE / 2;
    const color = KIND_COLORS[kind] ?? 0x94a3b8;

    this.body = scene.add.rectangle(worldX, worldY, 20, 20, color);
    this.body.setDepth(1);

    this.label = scene.add.text(worldX, worldY - 16, labelText, LABEL_STYLE);
    this.label.setOrigin(0.5, 1);
    this.label.setDepth(2);
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
  }
}
