import Phaser from "phaser";
import { TILE_SIZE } from "@odyssey/shared";
import { EQUIPMENT_ANCHORS } from "@odyssey/shared";
import { facingToDirection } from "../rendering/equippedItemSprite";
import { animKeyForFacing, idleFrameForFacing } from "../rendering/playerSprite";
import { diffRemotePlayers, readPlayerSnapshots } from "../interaction/roomState";

const REMOTE_HAND_COLOR = 0x78716c;
const REMOTE_HEAD_COLOR = 0xfbbf24;

interface RemotePlayerState {
  gridX: number;
  gridY: number;
  fx: number;
  fy: number;
}

interface EquipmentSprites {
  hand?: Phaser.GameObjects.Rectangle;
  head?: Phaser.GameObjects.Rectangle;
}

/**
 * Manages remote player sprites and their position/animation reconciliation.
 * Renders equipped hand/head as placeholder rectangles using EQUIPMENT_ANCHORS.
 */
export class RemotePlayersController {
  private readonly scene: Phaser.Scene;
  private readonly sprites = new Map<string, Phaser.GameObjects.Sprite>();
  private readonly equipmentSprites = new Map<string, EquipmentSprites>();
  private readonly state = new Map<string, RemotePlayerState>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Reconciles remote player sprites with the current room state.
   * Creates, updates, and removes sprites as needed.
   */
  reconcile(room: unknown): void {
    const snapshots = readPlayerSnapshots(room);
    const maybeRoom = room as { sessionId?: string } | null;
    const localSessionId = maybeRoom?.sessionId ?? null;
    const diff = diffRemotePlayers(
      snapshots,
      localSessionId,
      Array.from(this.sprites.keys())
    );

    for (const snapshot of diff.upserts) {
      this.upsertPlayer(snapshot);
    }

    for (const id of diff.removals) {
      this.removePlayer(id);
    }
  }

  /** Destroys all tracked remote-player sprites and equipment. */
  destroy(): void {
    for (const eq of this.equipmentSprites.values()) {
      eq.hand?.destroy();
      eq.head?.destroy();
    }
    this.equipmentSprites.clear();
    for (const sprite of this.sprites.values()) {
      sprite.destroy();
    }
    this.sprites.clear();
    this.state.clear();
  }

  /* ------------------------------------------------------------------ */
  /*  Private helpers                                                    */
  /* ------------------------------------------------------------------ */

  private upsertPlayer(snapshot: {
    sessionId: string;
    gridX: number;
    gridY: number;
    equippedHandDefId?: string;
    equippedHeadDefId?: string;
  }): void {
    const x = snapshot.gridX * TILE_SIZE + TILE_SIZE / 2;
    const y = snapshot.gridY * TILE_SIZE + TILE_SIZE / 2;
    const prev = this.state.get(snapshot.sessionId);
    let fx = prev?.fx ?? 0;
    let fy = prev?.fy ?? 1;
    const moved =
      prev != null &&
      (prev.gridX !== snapshot.gridX || prev.gridY !== snapshot.gridY);

    if (moved) {
      const dx = snapshot.gridX - prev.gridX;
      const dy = snapshot.gridY - prev.gridY;
      fx = Math.sign(dx);
      fy = dx !== 0 ? 0 : Math.sign(dy);
    }

    this.state.set(snapshot.sessionId, {
      gridX: snapshot.gridX,
      gridY: snapshot.gridY,
      fx,
      fy
    });

    let sprite = this.sprites.get(snapshot.sessionId);
    if (sprite) {
      sprite.setPosition(x, y);
    } else {
      sprite = this.scene.add.sprite(x, y, "remote_sprite", idleFrameForFacing(fx, fy));
      sprite.setDepth(4);
      this.sprites.set(snapshot.sessionId, sprite);
    }

    if (moved) {
      const key = animKeyForFacing("remote_sprite", fx, fy);
      if (sprite.anims.currentAnim?.key !== key) {
        sprite.play(key);
      }
    } else {
      sprite.stop();
      sprite.setFrame(idleFrameForFacing(fx, fy));
    }

    const dir = facingToDirection(fx, fy);
    let eq = this.equipmentSprites.get(snapshot.sessionId);
    if (!eq) {
      eq = {};
      this.equipmentSprites.set(snapshot.sessionId, eq);
    }
    if (snapshot.equippedHandDefId) {
      if (!eq.hand) {
        eq.hand = this.scene.add.rectangle(0, 0, 10, 8, REMOTE_HAND_COLOR);
        eq.hand.setOrigin(0.5, 0.5);
      }
      const hCfg = EQUIPMENT_ANCHORS.hand[dir];
      eq.hand.setPosition(x + hCfg.offset.x, y + hCfg.offset.y);
      eq.hand.setDepth(sprite.depth + hCfg.zOrder * 0.001);
    } else {
      eq.hand?.destroy();
      eq.hand = undefined;
    }
    if (snapshot.equippedHeadDefId) {
      if (!eq.head) {
        eq.head = this.scene.add.rectangle(0, 0, 12, 10, REMOTE_HEAD_COLOR);
        eq.head.setOrigin(0.5, 0.5);
      }
      const headCfg = EQUIPMENT_ANCHORS.head[dir];
      eq.head.setPosition(x + headCfg.offset.x, y + headCfg.offset.y);
      eq.head.setDepth(sprite.depth + headCfg.zOrder * 0.001);
    } else {
      eq.head?.destroy();
      eq.head = undefined;
    }
  }

  private removePlayer(sessionId: string): void {
    const eq = this.equipmentSprites.get(sessionId);
    eq?.hand?.destroy();
    eq?.head?.destroy();
    this.equipmentSprites.delete(sessionId);
    this.sprites.get(sessionId)?.destroy();
    this.sprites.delete(sessionId);
    this.state.delete(sessionId);
  }
}
