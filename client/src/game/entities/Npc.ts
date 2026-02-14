import Phaser from "phaser";
import { TILE_SIZE } from "@odyssey/shared";

const NPC_COLOR = 0xf472b6;
const NPC_LABEL_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontSize: "10px",
  color: "#ffffff",
  align: "center"
};

/**
 * An NPC placed on the village map.
 * Rendered as a colored circle with a name label.
 */
export class Npc {
  readonly npcId: string;
  readonly gridX: number;
  readonly gridY: number;
  readonly body: Phaser.GameObjects.Ellipse;
  readonly label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, npcId: string, gridX: number, gridY: number, displayName: string) {
    this.npcId = npcId;
    this.gridX = gridX;
    this.gridY = gridY;

    const worldX = gridX * TILE_SIZE + TILE_SIZE / 2;
    const worldY = gridY * TILE_SIZE + TILE_SIZE / 2;

    this.body = scene.add.ellipse(worldX, worldY, 24, 24, NPC_COLOR);
    this.body.setDepth(1);

    this.label = scene.add.text(worldX, worldY - 18, displayName, NPC_LABEL_STYLE);
    this.label.setOrigin(0.5, 1);
    this.label.setDepth(2);
  }

  /**
   * Returns true if the player at (px, py) is adjacent to this NPC
   * (within one tile in any cardinal direction).
   */
  isPlayerAdjacent(px: number, py: number): boolean {
    const dx = Math.abs(px - this.gridX);
    const dy = Math.abs(py - this.gridY);
    return (dx + dy) === 1;
  }

  /**
   * Returns true if the player at (px, py) facing (fx, fy) is
   * looking directly at this NPC.
   */
  isPlayerFacing(px: number, py: number, fx: number, fy: number): boolean {
    return (px + fx) === this.gridX && (py + fy) === this.gridY;
  }

  /** Removes the NPC game objects from the scene. */
  destroy(): void {
    this.body.destroy();
    this.label.destroy();
  }
}
