import Phaser from "phaser";
import { PLAYER_MOVE_SPEED, TILE_SIZE } from "@odyssey/shared";
import type { ToolActionType } from "@odyssey/shared";
import { blurFocusedFormField, isFormFieldFocused } from "../input/formFocus.js";
import { getFacingInteractionTile, getMovementVector } from "../input/movementIntent.js";
import { diffRemotePlayers, readPlayerSnapshots } from "../interaction/roomState.js";
import { worldToTile } from "../interaction/tileProjection.js";
import { useGameRoomBridgeStore } from "../../store/gameRoomBridge";
import { usePlayerControlStore } from "../../store/playerControl";

interface GameplayKeys {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  interact: Phaser.Input.Keyboard.Key;
}

/**
 * Main scene with Stardew-style input intent mapping.
 */
export class BootScene extends Phaser.Scene {
  private playerBody!: Phaser.GameObjects.Rectangle;
  private cursorMarker!: Phaser.GameObjects.Rectangle;
  private gameplayKeys!: GameplayKeys;
  private facingX = 1;
  private facingY = 0;
  private isChargingPrimary = false;
  private chargeStartedAtMs = 0;
  private lastSentGridX = -1;
  private lastSentGridY = -1;
  private remotePlayers = new Map<string, Phaser.GameObjects.Rectangle>();

  constructor() {
    super("BootScene");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#1f2937");
    this.add.text(16, 16, "Odyssey Game Scene", { color: "#ffffff" });
    this.playerBody = this.add.rectangle(10 * TILE_SIZE + 16, 10 * TILE_SIZE + 16, 20, 20, 0xa3e635);
    this.cursorMarker = this.add.rectangle(16, 16, TILE_SIZE, TILE_SIZE);
    this.cursorMarker.setStrokeStyle(2, 0xfacc15);
    this.cursorMarker.setFillStyle(0x000000, 0);

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error("Keyboard input unavailable");
    }
    this.gameplayKeys = keyboard.addKeys({
      left: "A",
      right: "D",
      up: "W",
      down: "S",
      interact: "X"
    }) as GameplayKeys;
    keyboard.addCapture?.("W,S,A,D,X");

    const canvas = this.game.canvas as HTMLCanvasElement | null | undefined;
    if (canvas && typeof canvas.setAttribute === "function") {
      canvas.setAttribute("tabindex", "0");
    }

    this.input.mouse?.disableContextMenu();
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      const tile = worldToTile(pointer.worldX, pointer.worldY);
      usePlayerControlStore.getState().setCursorTile(tile.gridX, tile.gridY);
      this.cursorMarker.setPosition(tile.gridX * TILE_SIZE + 16, tile.gridY * TILE_SIZE + 16);
    });

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (usePlayerControlStore.getState().inputMode !== "game") {
        return;
      }
      blurFocusedFormField(document.activeElement);
      if (canvas && typeof canvas.focus === "function") {
        canvas.focus();
      }
      if (pointer.rightButtonDown()) {
        this.sendPointerInteract("secondary", 0);
        return;
      }
      if (this.shouldChargePrimary()) {
        this.isChargingPrimary = true;
        this.chargeStartedAtMs = this.time.now;
        return;
      }
      this.sendPointerInteract("primary", 0);
    });

    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (!this.isChargingPrimary || pointer.button !== 0) {
        return;
      }
      this.isChargingPrimary = false;
      const chargeMs = Math.max(0, Math.floor(this.time.now - this.chargeStartedAtMs));
      this.sendPointerInteract("primary", chargeMs);
    });
  }

  update(_time: number, delta: number): void {
    const controlState = usePlayerControlStore.getState();
    const room = useGameRoomBridgeStore.getState().room;
    try {
      this.reconcilePlayersFromRoom(room);
    } catch (error) {
      console.error("Room reconcile failed", error);
    }
    const blockedByFormFocus = isFormFieldFocused(document.activeElement);
    if (
      Phaser.Input.Keyboard.JustDown(this.gameplayKeys.interact) &&
      controlState.inputMode === "game" &&
      !blockedByFormFocus
    ) {
      const origin = this.getPlayerGrid();
      const target = getFacingInteractionTile(origin.gridX, origin.gridY, this.facingX, this.facingY);
      useGameRoomBridgeStore.getState().sendInteract({
        target: { gridX: target.x, gridY: target.y },
        toolId: controlState.equippedToolId,
        actionType: "primary",
        chargeMs: 0
      });
    }

    if (controlState.inputMode !== "game" || blockedByFormFocus) {
      return;
    }
    const movement = getMovementVector(
      this.gameplayKeys.left.isDown,
      this.gameplayKeys.right.isDown,
      this.gameplayKeys.up.isDown,
      this.gameplayKeys.down.isDown
    );

    if (movement.x !== 0 || movement.y !== 0) {
      this.facingX = Math.round(movement.x);
      this.facingY = Math.round(movement.y);
    }

    this.playerBody.x += movement.x * PLAYER_MOVE_SPEED * (delta / 1000);
    this.playerBody.y += movement.y * PLAYER_MOVE_SPEED * (delta / 1000);

    const grid = this.getPlayerGrid();
    if (grid.gridX !== this.lastSentGridX || grid.gridY !== this.lastSentGridY) {
      useGameRoomBridgeStore.getState().sendMove(grid);
      this.lastSentGridX = grid.gridX;
      this.lastSentGridY = grid.gridY;
    }
  }

  private shouldChargePrimary(): boolean {
    const { equippedToolId } = usePlayerControlStore.getState();
    return equippedToolId === "watering_can";
  }

  private sendPointerInteract(actionType: ToolActionType, chargeMs: number): void {
    const controlState = usePlayerControlStore.getState();
    const pointer = this.input.activePointer;
    const tile = worldToTile(pointer.worldX, pointer.worldY);
    useGameRoomBridgeStore.getState().sendInteract({
      target: tile,
      toolId: controlState.equippedToolId,
      actionType,
      chargeMs
    });
  }

  private getPlayerGrid(): { gridX: number; gridY: number } {
    return worldToTile(this.playerBody.x, this.playerBody.y);
  }

  private reconcilePlayersFromRoom(room: unknown): void {
    const snapshots = readPlayerSnapshots(room);
    const maybeRoom = room as { sessionId?: string } | null;
    const localSessionId = maybeRoom?.sessionId ?? null;
    const diff = diffRemotePlayers(snapshots, localSessionId, Array.from(this.remotePlayers.keys()));

    for (const snapshot of diff.upserts) {
      const x = snapshot.gridX * TILE_SIZE + 16;
      const y = snapshot.gridY * TILE_SIZE + 16;
      const existing = this.remotePlayers.get(snapshot.sessionId);
      if (existing) {
        existing.setPosition(x, y);
      } else {
        const remoteBody = this.add.rectangle(x, y, 20, 20, 0x60a5fa);
        this.remotePlayers.set(snapshot.sessionId, remoteBody);
      }
    }

    for (const sessionId of diff.removals) {
      const remoteBody = this.remotePlayers.get(sessionId);
      remoteBody?.destroy();
      this.remotePlayers.delete(sessionId);
    }

    if (!localSessionId) {
      return;
    }
    const localSnapshot = snapshots.find((snapshot) => snapshot.sessionId === localSessionId);
    if (!localSnapshot) {
      return;
    }
    const targetX = localSnapshot.gridX * TILE_SIZE + 16;
    const targetY = localSnapshot.gridY * TILE_SIZE + 16;
    const deltaX = Math.abs(targetX - this.playerBody.x);
    const deltaY = Math.abs(targetY - this.playerBody.y);
    if (deltaX > TILE_SIZE || deltaY > TILE_SIZE) {
      this.playerBody.setPosition(targetX, targetY);
    }
  }
}
