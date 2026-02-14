import Phaser from "phaser";
import { TILE_SIZE } from "@odyssey/shared";
import type { CollisionGrid } from "../map/collisionGrid";

/** Cardinal direction enum. */
export type Direction = "up" | "down" | "left" | "right";

/** Offsets for each direction. */
const DIR_OFFSET: Record<Direction, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 }
};

/** Duration of one tile-to-tile tween in milliseconds. */
const MOVE_DURATION_MS = 150;

/**
 * Callback invoked every time the player finishes a move to a new grid cell.
 */
export type OnGridArrive = (gridX: number, gridY: number) => void;

/**
 * Manages tile-by-tile grid movement with collision checking and
 * smooth tween interpolation between cells.
 */
export class GridMovement {
  private gridX: number;
  private gridY: number;
  private facingX = 0;
  private facingY = 1;
  private moving = false;
  private readonly sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;
  private readonly scene: Phaser.Scene;
  private readonly collisionGrid: CollisionGrid;
  private readonly onArrive: OnGridArrive;

  constructor(
    scene: Phaser.Scene,
    sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle,
    collisionGrid: CollisionGrid,
    startGridX: number,
    startGridY: number,
    onArrive: OnGridArrive
  ) {
    this.scene = scene;
    this.sprite = sprite;
    this.collisionGrid = collisionGrid;
    this.gridX = startGridX;
    this.gridY = startGridY;
    this.onArrive = onArrive;
    this.snapToGrid();
  }

  /** Current grid X coordinate. */
  getGridX(): number {
    return this.gridX;
  }

  /** Current grid Y coordinate. */
  getGridY(): number {
    return this.gridY;
  }

  /** Horizontal component of facing direction (-1, 0, or 1). */
  getFacingX(): number {
    return this.facingX;
  }

  /** Vertical component of facing direction (-1, 0, or 1). */
  getFacingY(): number {
    return this.facingY;
  }

  /** True while the sprite is tweening between tiles. */
  isMoving(): boolean {
    return this.moving;
  }

  /**
   * Attempt to move one tile in the given direction.
   * Updates facing regardless of whether the move is possible.
   * Returns true if the move was accepted.
   */
  tryMove(direction: Direction): boolean {
    const offset = DIR_OFFSET[direction];
    this.facingX = offset.dx;
    this.facingY = offset.dy;

    if (this.moving) {
      return false;
    }

    const targetX = this.gridX + offset.dx;
    const targetY = this.gridY + offset.dy;

    if (!this.collisionGrid.isWalkable(targetX, targetY)) {
      return false;
    }

    this.moving = true;
    this.gridX = targetX;
    this.gridY = targetY;

    const worldX = targetX * TILE_SIZE + TILE_SIZE / 2;
    const worldY = targetY * TILE_SIZE + TILE_SIZE / 2;

    this.scene.tweens.add({
      targets: this.sprite,
      x: worldX,
      y: worldY,
      duration: MOVE_DURATION_MS,
      ease: "Linear",
      onComplete: () => {
        this.moving = false;
        this.onArrive(this.gridX, this.gridY);
      }
    });

    return true;
  }

  /** Teleport sprite to the current grid position without tweening. */
  snapToGrid(): void {
    this.sprite.x = this.gridX * TILE_SIZE + TILE_SIZE / 2;
    this.sprite.y = this.gridY * TILE_SIZE + TILE_SIZE / 2;
  }
}

/**
 * Converts held directional keys into a Direction, or null if none pressed.
 * Prioritizes vertical over horizontal when both are held.
 */
export function keysToDirection(
  left: boolean,
  right: boolean,
  up: boolean,
  down: boolean
): Direction | null {
  if (up) return "up";
  if (down) return "down";
  if (left) return "left";
  if (right) return "right";
  return null;
}
