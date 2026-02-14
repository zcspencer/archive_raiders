import Phaser from "phaser";
import { TILE_SIZE } from "@odyssey/shared";
import { animKeyForFacing, idleFrameForFacing } from "../rendering/playerSprite";
import { diffRemotePlayers, readPlayerSnapshots } from "../interaction/roomState";

interface RemotePlayerState {
  gridX: number;
  gridY: number;
  fx: number;
  fy: number;
}

/**
 * Manages remote player sprites and their position/animation reconciliation.
 * Owns the sprite map and per-player facing state so scenes stay lean.
 */
export class RemotePlayersController {
  private readonly scene: Phaser.Scene;
  private readonly sprites = new Map<string, Phaser.GameObjects.Sprite>();
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

  /** Destroys all tracked remote-player sprites. */
  destroy(): void {
    for (const sprite of this.sprites.values()) {
      sprite.destroy();
    }
    this.sprites.clear();
    this.state.clear();
  }

  /* ------------------------------------------------------------------ */
  /*  Private helpers                                                    */
  /* ------------------------------------------------------------------ */

  private upsertPlayer(snapshot: { sessionId: string; gridX: number; gridY: number }): void {
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
  }

  private removePlayer(sessionId: string): void {
    this.sprites.get(sessionId)?.destroy();
    this.sprites.delete(sessionId);
    this.state.delete(sessionId);
  }
}
