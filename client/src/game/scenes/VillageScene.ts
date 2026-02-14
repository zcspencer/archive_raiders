import Phaser from "phaser";
import { TILE_SIZE } from "@odyssey/shared";
import type { ParsedMap } from "../map/TileMapManager";
import { generateTilesetTexture, renderGroundLayer } from "../map/tileRenderer";
import { generatePlayerTexture, animKeyForFacing, idleFrameForFacing } from "../rendering/playerSprite";
import { GridMovement, keysToDirection } from "../systems/gridMovement";
import { Npc } from "../entities/Npc";
import { InteractableObject } from "../entities/InteractableObject";
import { findInteractionTarget } from "../systems/interactionDetection";
import { getNpcDialogue, getNpcDefinition } from "../content/npcDialogue";
import { diffRemotePlayers, readPlayerSnapshots } from "../interaction/roomState";
import { isFormFieldFocused } from "../input/formFocus";
import { useGameRoomBridgeStore } from "../../store/gameRoomBridge";
import { usePlayerControlStore } from "../../store/playerControl";
import { useDialogueStore } from "../../store/dialogue";

interface GameplayKeys {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  interact: Phaser.Input.Keyboard.Key;
}

/**
 * Main gameplay scene: village map with grid movement, NPCs, and interaction.
 */
export class VillageScene extends Phaser.Scene {
  private playerSprite!: Phaser.GameObjects.Sprite;
  private gameplayKeys!: GameplayKeys;
  private gridMovement!: GridMovement;
  private npcs: Npc[] = [];
  private objects: InteractableObject[] = [];
  private remotePlayers = new Map<string, Phaser.GameObjects.Rectangle>();

  constructor() {
    super("VillageScene");
  }

  create(): void {
    const mapData = this.registry.get("parsedMap") as ParsedMap | undefined;
    if (!mapData) {
      throw new Error("VillageScene requires parsedMap in registry");
    }

    generateTilesetTexture(this);
    generatePlayerTexture(this);
    renderGroundLayer(this, mapData.groundData, mapData.width, mapData.height);

    this.playerSprite = this.add.sprite(0, 0, "player_sprite", 0);
    this.playerSprite.setDepth(5);

    this.gridMovement = new GridMovement(
      this,
      this.playerSprite,
      mapData.collisionGrid,
      mapData.playerSpawn.gridX,
      mapData.playerSpawn.gridY,
      (gx, gy) => useGameRoomBridgeStore.getState().sendMove({ gridX: gx, gridY: gy })
    );

    this.spawnNpcs(mapData);
    this.spawnObjects(mapData);
    this.setupInput();
    this.setupCamera(mapData);
  }

  update(): void {
    const controlState = usePlayerControlStore.getState();
    const room = useGameRoomBridgeStore.getState().room;
    const dialogueActive = useDialogueStore.getState().isActive;

    this.reconcileRemotePlayers(room);

    const blocked =
      controlState.inputMode !== "game" ||
      isFormFieldFocused(document.activeElement) ||
      dialogueActive;

    if (Phaser.Input.Keyboard.JustDown(this.gameplayKeys.interact) && !blocked) {
      this.handleInteraction();
    }

    if (!blocked) {
      this.handleMovement();
    }

    this.updatePlayerAnimation();
  }

  /* ------------------------------------------------------------------ */
  /*  Private helpers                                                    */
  /* ------------------------------------------------------------------ */

  private spawnNpcs(mapData: ParsedMap): void {
    for (const placement of mapData.npcs) {
      const def = getNpcDefinition(placement.npcId);
      const displayName = def?.displayName ?? placement.npcId;
      this.npcs.push(new Npc(this, placement.npcId, placement.gridX, placement.gridY, displayName));
    }
  }

  private spawnObjects(mapData: ParsedMap): void {
    for (const placement of mapData.objects) {
      this.objects.push(
        new InteractableObject(
          this,
          placement.objectId,
          placement.kind,
          placement.label,
          placement.gridX,
          placement.gridY
        )
      );
    }
  }

  private setupInput(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error("Keyboard input unavailable");

    this.gameplayKeys = keyboard.addKeys({
      left: "A",
      right: "D",
      up: "W",
      down: "S",
      interact: "X"
    }) as GameplayKeys;
    keyboard.addCapture?.("W,S,A,D,X");

    const canvas = this.game.canvas as HTMLCanvasElement | null;
    if (canvas?.setAttribute) canvas.setAttribute("tabindex", "0");
    this.input.mouse?.disableContextMenu();
  }

  private setupCamera(mapData: ParsedMap): void {
    const worldW = mapData.width * TILE_SIZE;
    const worldH = mapData.height * TILE_SIZE;
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.startFollow(this.playerSprite, true, 0.1, 0.1);
    this.cameras.main.setBackgroundColor("#1f2937");
  }

  private handleMovement(): void {
    const dir = keysToDirection(
      this.gameplayKeys.left.isDown,
      this.gameplayKeys.right.isDown,
      this.gameplayKeys.up.isDown,
      this.gameplayKeys.down.isDown
    );
    if (dir) {
      this.gridMovement.tryMove(dir);
    }
  }

  private handleInteraction(): void {
    const target = findInteractionTarget(
      this.npcs,
      this.objects,
      this.gridMovement.getGridX(),
      this.gridMovement.getGridY(),
      this.gridMovement.getFacingX(),
      this.gridMovement.getFacingY()
    );
    if (!target) return;

    if (target.type === "npc") {
      const lines = getNpcDialogue(target.entity.npcId);
      if (lines.length > 0) {
        const def = getNpcDefinition(target.entity.npcId);
        useDialogueStore.getState().openDialogue(def?.displayName ?? target.entity.npcId, lines);
        usePlayerControlStore.getState().setInputMode("ui");
      }
    }
    /* Objects emit a console log for now; future batches add real behavior. */
    if (target.type === "object") {
      console.log(`Interacted with ${target.entity.kind}: ${target.entity.objectId}`);
    }
  }

  private updatePlayerAnimation(): void {
    const fx = this.gridMovement.getFacingX();
    const fy = this.gridMovement.getFacingY();
    if (this.gridMovement.isMoving()) {
      const animKey = animKeyForFacing(fx, fy);
      if (this.playerSprite.anims.currentAnim?.key !== animKey) {
        this.playerSprite.play(animKey);
      }
    } else {
      this.playerSprite.stop();
      this.playerSprite.setFrame(idleFrameForFacing(fx, fy));
    }
  }

  private reconcileRemotePlayers(room: unknown): void {
    const snapshots = readPlayerSnapshots(room);
    const maybeRoom = room as { sessionId?: string } | null;
    const localSessionId = maybeRoom?.sessionId ?? null;
    const diff = diffRemotePlayers(snapshots, localSessionId, Array.from(this.remotePlayers.keys()));

    for (const snapshot of diff.upserts) {
      const x = snapshot.gridX * TILE_SIZE + TILE_SIZE / 2;
      const y = snapshot.gridY * TILE_SIZE + TILE_SIZE / 2;
      const existing = this.remotePlayers.get(snapshot.sessionId);
      if (existing) {
        existing.setPosition(x, y);
      } else {
        const body = this.add.rectangle(x, y, 20, 20, 0x60a5fa);
        body.setDepth(4);
        this.remotePlayers.set(snapshot.sessionId, body);
      }
    }

    for (const id of diff.removals) {
      this.remotePlayers.get(id)?.destroy();
      this.remotePlayers.delete(id);
    }
  }
}
