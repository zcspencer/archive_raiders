import Phaser from "phaser";
import { TILE_SIZE } from "@odyssey/shared";
import type { CollisionGrid } from "../map/collisionGrid";
import { useGameRoomBridgeStore } from "../../store/gameRoomBridge";

const DEFINITION_COLORS: Record<string, number> = {
  tree: 0x22c55e,
  rock: 0x78716c
};

const DEFAULT_COLOR = 0x94a3b8;
const HEALTH_BAR_WIDTH = 24;
const HEALTH_BAR_HEIGHT = 4;
const HEALTH_BAR_OFFSET_Y = -16;

interface WorldObjectSnapshot {
  objectId: string;
  definitionId: string;
  gridX: number;
  gridY: number;
  health: number;
  maxHealth: number;
}

interface WorldObjectSprites {
  body: Phaser.GameObjects.Rectangle;
  healthBarBg: Phaser.GameObjects.Rectangle;
  healthBarFill: Phaser.GameObjects.Rectangle;
  gridX: number;
  gridY: number;
}

/**
 * Reads world object snapshots from room state.
 */
function readWorldObjectSnapshots(room: unknown): WorldObjectSnapshot[] {
  const maybeRoom = room as { state?: { worldObjects?: { forEach: (cb: (v: unknown, k: string) => void) => void } } };
  const worldObjects = maybeRoom?.state?.worldObjects;
  if (!worldObjects?.forEach) return [];

  const snapshots: WorldObjectSnapshot[] = [];
  worldObjects.forEach((value, objectId) => {
    const obj = value as { definitionId?: string; gridX?: number; gridY?: number; health?: number; maxHealth?: number };
    if (
      typeof obj.definitionId === "string" &&
      typeof obj.gridX === "number" &&
      typeof obj.gridY === "number" &&
      typeof obj.health === "number" &&
      typeof obj.maxHealth === "number"
    ) {
      snapshots.push({
        objectId,
        definitionId: obj.definitionId,
        gridX: obj.gridX,
        gridY: obj.gridY,
        health: obj.health,
        maxHealth: obj.maxHealth
      });
    }
  });
  return snapshots;
}

/**
 * Reconciles Colyseus world object state with Phaser sprites and health bars.
 * Placeholder rectangles per definitionId; health bar shown when health < maxHealth.
 */
export class WorldObjectsController {
  private readonly scene: Phaser.Scene;
  private readonly collisionGrid: CollisionGrid | null;
  private readonly sprites = new Map<string, WorldObjectSprites>();

  constructor(scene: Phaser.Scene, collisionGrid?: CollisionGrid) {
    this.scene = scene;
    this.collisionGrid = collisionGrid ?? null;
  }

  /**
   * Call each frame (or when room state may have changed) to sync sprites with room.state.worldObjects.
   */
  reconcile(): void {
    const room = useGameRoomBridgeStore.getState().room;
    const snapshots = readWorldObjectSnapshots(room);
    const currentIds = new Set(snapshots.map((s) => s.objectId));

    for (const id of this.sprites.keys()) {
      if (!currentIds.has(id)) {
        this.removeObject(id);
      }
    }

    for (const snap of snapshots) {
      this.upsertObject(snap);
    }
  }

  destroy(): void {
    for (const id of Array.from(this.sprites.keys())) {
      this.removeObject(id);
    }
  }

  private removeObject(objectId: string): void {
    const sprites = this.sprites.get(objectId);
    if (sprites) {
      this.collisionGrid?.unblockTile(sprites.gridX, sprites.gridY);
      sprites.body.destroy();
      sprites.healthBarBg.destroy();
      sprites.healthBarFill.destroy();
      this.sprites.delete(objectId);
    }
  }

  private upsertObject(snap: WorldObjectSnapshot): void {
    const worldX = snap.gridX * TILE_SIZE + TILE_SIZE / 2;
    const worldY = snap.gridY * TILE_SIZE + TILE_SIZE / 2;
    const color = DEFINITION_COLORS[snap.definitionId] ?? DEFAULT_COLOR;

    let sprites = this.sprites.get(snap.objectId);
    if (!sprites) {
      const body = this.scene.add.rectangle(worldX, worldY, 20, 20, color);
      body.setDepth(1);

      const barY = worldY + HEALTH_BAR_OFFSET_Y;
      const healthBarBg = this.scene.add.rectangle(
        worldX - HEALTH_BAR_WIDTH / 2,
        barY,
        HEALTH_BAR_WIDTH,
        HEALTH_BAR_HEIGHT,
        0x1f2937
      );
      healthBarBg.setDepth(2);

      const healthBarFill = this.scene.add.rectangle(
        worldX - HEALTH_BAR_WIDTH / 2,
        barY,
        HEALTH_BAR_WIDTH,
        HEALTH_BAR_HEIGHT,
        0x22c55e
      );
      healthBarFill.setOrigin(0, 0.5);
      healthBarFill.setDepth(2);

      this.collisionGrid?.blockTile(snap.gridX, snap.gridY);
      sprites = { body, healthBarBg, healthBarFill, gridX: snap.gridX, gridY: snap.gridY };
      this.sprites.set(snap.objectId, sprites);
    }

    sprites.body.setPosition(worldX, worldY);
    sprites.healthBarBg.setPosition(worldX - HEALTH_BAR_WIDTH / 2, worldY + HEALTH_BAR_OFFSET_Y);
    const fillWidth = snap.maxHealth > 0 ? (snap.health / snap.maxHealth) * HEALTH_BAR_WIDTH : 0;
    sprites.healthBarFill.setSize(Math.max(0, fillWidth), HEALTH_BAR_HEIGHT);
    sprites.healthBarFill.setPosition(worldX - HEALTH_BAR_WIDTH / 2, worldY + HEALTH_BAR_OFFSET_Y);

    const showBar = snap.health < snap.maxHealth;
    sprites.healthBarBg.setVisible(showBar);
    sprites.healthBarFill.setVisible(showBar);
  }
}
