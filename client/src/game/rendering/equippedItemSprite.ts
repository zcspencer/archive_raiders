import Phaser from "phaser";
import {
  EQUIPMENT_ANCHORS,
  type EquipmentSlot,
  type FacingDirection
} from "@odyssey/shared";
import type { ItemInstance } from "@odyssey/shared";

const PLACEHOLDER_WIDTH = 10;
const PLACEHOLDER_HEIGHT = 8;
const HAND_COLOR = 0x78716c;
const HEAD_COLOR = 0xfbbf24;

/**
 * Converts grid facing (fx, fy) to FacingDirection for anchor lookup.
 */
export function facingToDirection(fx: number, fy: number): FacingDirection {
  if (fy < 0) return "up";
  if (fy > 0) return "down";
  if (fx < 0) return "left";
  return "right";
}

export interface EquippedState {
  handInstanceId: string | null;
  headInstanceId: string | null;
  items: ItemInstance[];
  getDefinition: (id: string) => { equippedSprite?: string } | undefined;
  facingX: number;
  facingY: number;
}

/**
 * Manages child sprites on the player for equipped hand and head items.
 * Uses EQUIPMENT_ANCHORS for offset/depth/flip; creates placeholder rectangles
 * when no equippedSprite is available.
 */
export class EquippedItemSpriteController {
  private handSprite: Phaser.GameObjects.Rectangle | null = null;
  private headSprite: Phaser.GameObjects.Rectangle | null = null;
  private lastHandId: string | null = null;
  private lastHeadId: string | null = null;
  private lastDir: FacingDirection = "down";

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly parent: Phaser.GameObjects.Sprite,
    private readonly getState: () => EquippedState
  ) {}

  /**
   * Call each frame (or when equipment/facing may have changed) to sync
   * child sprites with current equipment and facing.
   */
  sync(): void {
    const state = this.getState();
    const dir = facingToDirection(state.facingX, state.facingY);

    const handKey = state.handInstanceId ?? "";
    const headKey = state.headInstanceId ?? "";

    if (this.lastHandId !== handKey || this.lastDir !== dir) {
      this.destroyHand();
      if (state.handInstanceId) {
        this.handSprite = this.createPlaceholder(
          "hand",
          dir,
          HAND_COLOR
        );
      }
      this.lastHandId = handKey;
    }

    if (this.lastHeadId !== headKey || this.lastDir !== dir) {
      this.destroyHead();
      if (state.headInstanceId) {
        this.headSprite = this.createPlaceholder(
          "head",
          dir,
          HEAD_COLOR
        );
      }
      this.lastHeadId = headKey;
    }

    this.lastDir = dir;

    if (this.handSprite) {
      this.applyAnchor("hand", dir, this.handSprite);
    }
    if (this.headSprite) {
      this.applyAnchor("head", dir, this.headSprite);
    }
  }

  destroy(): void {
    this.destroyHand();
    this.destroyHead();
  }

  private destroyHand(): void {
    if (this.handSprite) {
      this.handSprite.destroy();
      this.handSprite = null;
    }
  }

  private destroyHead(): void {
    if (this.headSprite) {
      this.headSprite.destroy();
      this.headSprite = null;
    }
  }

  private createPlaceholder(
    slot: EquipmentSlot,
    dir: FacingDirection,
    color: number
  ): Phaser.GameObjects.Rectangle {
    const rect = this.scene.add.rectangle(
      0,
      0,
      slot === "hand" ? PLACEHOLDER_WIDTH : 12,
      slot === "hand" ? PLACEHOLDER_HEIGHT : 10,
      color
    );
    rect.setOrigin(0.5, 0.5);
    this.applyAnchor(slot, dir, rect);
    return rect;
  }

  private applyAnchor(
    slot: EquipmentSlot,
    dir: FacingDirection,
    child: Phaser.GameObjects.Rectangle
  ): void {
    const cfg = EQUIPMENT_ANCHORS[slot][dir];
    child.setPosition(this.parent.x + cfg.offset.x, this.parent.y + cfg.offset.y);
    child.setDepth(this.parent.depth + cfg.zOrder * 0.001);
  }
}
