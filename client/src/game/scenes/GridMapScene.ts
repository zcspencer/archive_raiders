import Phaser from "phaser";
import { TILE_SIZE } from "@odyssey/shared";
import type { ParsedMap } from "../map/TileMapManager";
import { generateTilesetTexture, renderGroundLayer } from "../map/tileRenderer";
import { generatePlayerTexture, animKeyForFacing, idleFrameForFacing } from "../rendering/playerSprite";
import {
  EquippedItemSpriteController,
  type EquippedState
} from "../rendering/equippedItemSprite";
import { GridMovement, keysToDirection } from "../systems/gridMovement";
import { Npc } from "../entities/Npc";
import { InteractableObject } from "../entities/InteractableObject";
import { getNpcDefinition } from "../content/npcDialogue";
import { getItemDefinition } from "../../data/itemDefinitions";
import { GameplayInput } from "../systems/GameplayInput";
import { InteractionHandler } from "../systems/InteractionHandler";
import { useGameRoomBridgeStore } from "../../store/gameRoomBridge";
import { usePlayerInventoryStore } from "../../store/playerInventory";

/**
 * Scene-init data passed through `scene.start(key, data)`.
 */
export interface GridMapSceneData {
  mapKey?: string;
  spawnGridX?: number;
  spawnGridY?: number;
}

/**
 * Abstract base scene for any map with grid movement, NPCs, objects,
 * and interaction. Subclasses provide the scene key and may add
 * additional behaviour (e.g. remote player reconciliation).
 */
export abstract class GridMapScene extends Phaser.Scene {
  protected playerSprite!: Phaser.GameObjects.Sprite;
  protected gridMovement!: GridMovement;
  protected equippedSpriteController!: EquippedItemSpriteController;
  protected input_!: GameplayInput;
  protected interaction!: InteractionHandler;
  protected npcs: Npc[] = [];
  protected objects: InteractableObject[] = [];

  create(data?: GridMapSceneData): void {
    const mapKey = data?.mapKey ?? "parsedMap";
    const mapData = this.registry.get(mapKey) as ParsedMap | undefined;
    if (!mapData) {
      throw new Error(`${this.scene.key} requires ${mapKey} in registry`);
    }

    generateTilesetTexture(this);
    generatePlayerTexture(this);
    renderGroundLayer(this, mapData.groundData, mapData.width, mapData.height);

    this.playerSprite = this.add.sprite(0, 0, "player_sprite", 0);
    this.playerSprite.setDepth(5);

    const spawnX = data?.spawnGridX ?? mapData.playerSpawn.gridX;
    const spawnY = data?.spawnGridY ?? mapData.playerSpawn.gridY;

    this.gridMovement = new GridMovement(
      this,
      this.playerSprite,
      mapData.collisionGrid,
      spawnX,
      spawnY,
      (gx, gy) => useGameRoomBridgeStore.getState().sendMove({ gridX: gx, gridY: gy })
    );

    this.equippedSpriteController = new EquippedItemSpriteController(
      this,
      this.playerSprite,
      () => this.getEquippedState()
    );

    this.npcs = [];
    this.objects = [];
    this.spawnNpcs(mapData);
    this.spawnObjects(mapData);

    this.input_ = new GameplayInput(this);
    this.interaction = new InteractionHandler((targetScene, sceneData) => {
      this.scene.start(targetScene, sceneData);
    });

    this.setupCamera(mapData);
  }

  update(): void {
    const px = this.gridMovement.getGridX();
    const py = this.gridMovement.getGridY();

    this.updatePrompts(px, py);

    const blocked = this.input_.isBlocked();

    if (this.input_.justPressedInteract() && !blocked) {
      this.interaction.handle(
        this.npcs,
        this.objects,
        px,
        py,
        this.gridMovement.getFacingX(),
        this.gridMovement.getFacingY()
      );
    }

    if (!blocked) {
      this.handleMovement();
    }

    this.updatePlayerAnimation();
  }

  /* ------------------------------------------------------------------ */
  /*  Overridable hooks                                                  */
  /* ------------------------------------------------------------------ */

  /** Returns current equipment and facing for equipped sprite controller. */
  protected getEquippedState(): EquippedState {
    const room = useGameRoomBridgeStore.getState().room;
    const items = usePlayerInventoryStore.getState().items;
    const player = room?.state?.players?.get(
      (room as { sessionId?: string })?.sessionId ?? ""
    ) as { equippedHandItemId?: string; equippedHeadItemId?: string } | undefined;
    const handId = player?.equippedHandItemId;
    const headId = player?.equippedHeadItemId;
    return {
      handInstanceId: handId && handId !== "" ? handId : null,
      headInstanceId: headId && headId !== "" ? headId : null,
      items,
      getDefinition: getItemDefinition,
      facingX: this.gridMovement.getFacingX(),
      facingY: this.gridMovement.getFacingY()
    };
  }

  /** Called each frame to update NPC/object proximity prompts. */
  protected updatePrompts(px: number, py: number): void {
    for (const npc of this.npcs) {
      npc.setInteractionPromptVisible(npc.isPlayerAdjacent(px, py));
    }
    for (const obj of this.objects) {
      obj.setInteractionPromptVisible(obj.isPlayerAdjacent(px, py));
    }
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

  private setupCamera(mapData: ParsedMap): void {
    const worldW = mapData.width * TILE_SIZE;
    const worldH = mapData.height * TILE_SIZE;
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.startFollow(this.playerSprite, true, 0.1, 0.1);
    this.cameras.main.setBackgroundColor("#1f2937");
  }

  private handleMovement(): void {
    const keys = this.input_.keys;
    const dir = keysToDirection(
      keys.left.isDown,
      keys.right.isDown,
      keys.up.isDown,
      keys.down.isDown
    );
    if (dir) {
      this.gridMovement.tryMove(dir);
    }
  }

  private updatePlayerAnimation(): void {
    const fx = this.gridMovement.getFacingX();
    const fy = this.gridMovement.getFacingY();
    if (this.gridMovement.isMoving()) {
      const animKey = animKeyForFacing("player_sprite", fx, fy);
      if (this.playerSprite.anims.currentAnim?.key !== animKey) {
        this.playerSprite.play(animKey);
      }
    } else {
      this.playerSprite.stop();
      this.playerSprite.setFrame(idleFrameForFacing(fx, fy));
    }
    this.equippedSpriteController.sync();
  }
}
