import Phaser from "phaser";
import type { ParsedTiledMap } from "../map/TiledMapParser";
import { renderTiledLayers } from "../map/tiledTileRenderer";
import {
  generatePlayerTexture,
  animKeyForFacing,
  idleFrameForFacing
} from "../rendering/playerSprite";
import {
  EquippedItemSpriteController,
  type EquippedState
} from "../rendering/equippedItemSprite";
import { GridMovement, keysToDirection } from "../systems/gridMovement";
import { Npc } from "../entities/Npc";
import { InteractableObject } from "../entities/InteractableObject";
import { getNpcDefinition } from "../content/npcDialogue";
import { getItemDefinition } from "../../data/itemDefinitions";
import { AttackInput } from "../systems/attackInput";
import { GameplayInput } from "../systems/GameplayInput";
import { InteractionHandler } from "../systems/InteractionHandler";
import { RemotePlayersController } from "../systems/RemotePlayersController";
import { WorldObjectsController } from "../systems/WorldObjectsController";
import { useGameRoomBridgeStore } from "../../store/gameRoomBridge";
import { usePlayerInventoryStore } from "../../store/playerInventory";

/**
 * Scene-init data passed through scene.start().
 */
export interface TiledMapSceneData {
  mapKey?: string;
  spawnName?: string;
  spawnGridX?: number;
  spawnGridY?: number;
}

/**
 * Generic scene that loads any Tiled map. Replaces per-map scene subclasses.
 */
export class TiledMapScene extends Phaser.Scene {
  constructor() {
    super("TiledMapScene");
  }

  private playerSprite!: Phaser.GameObjects.Sprite;
  private gridMovement!: GridMovement;
  private equippedSpriteController!: EquippedItemSpriteController;
  private remotePlayers!: RemotePlayersController;
  private worldObjects!: WorldObjectsController;
  private input_!: GameplayInput;
  private attackInput!: AttackInput;
  private interaction!: InteractionHandler;
  private npcs: Npc[] = [];
  private objects: InteractableObject[] = [];
  private currentMapKey = "parsedMap_village";

  create(data?: TiledMapSceneData): void {
    const mapKey = data?.mapKey ?? "parsedMap_village";
    this.currentMapKey = mapKey;
    this.registry.set("__activeMapKey", mapKey);
    const mapData = this.registry.get(mapKey) as ParsedTiledMap | undefined;
    if (!mapData) {
      throw new Error(`TiledMapScene requires ${mapKey} in registry`);
    }

    generatePlayerTexture(this);
    renderTiledLayers(this, mapData);

    this.playerSprite = this.add.sprite(0, 0, "player_sprite", 0);
    this.playerSprite.setDepth(5);

    const spawn = this.resolveSpawn(mapData, data);
    this.gridMovement = new GridMovement(
      this,
      this.playerSprite,
      mapData.collisionGrid,
      spawn.gridX,
      spawn.gridY,
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
    this.spawnTransitions(mapData);

    this.input_ = new GameplayInput(this);
    this.attackInput = new AttackInput(this, {
      getGridX: () => this.gridMovement.getGridX(),
      getGridY: () => this.gridMovement.getGridY(),
      isBlocked: () => this.input_.isBlocked(),
      onAttackSent: (targetGridX, targetGridY) => {
        const px = this.gridMovement.getGridX();
        const py = this.gridMovement.getGridY();
        const dx = targetGridX - px;
        const dy = targetGridY - py;
        this.equippedSpriteController.playAttackArc(dx, dy);
      }
    });
    this.interaction = new InteractionHandler((targetScene, sceneData) => {
      this.scene.start(targetScene, sceneData);
    });
    this.remotePlayers = new RemotePlayersController(this);
    this.worldObjects = new WorldObjectsController(this, mapData.collisionGrid);
    useGameRoomBridgeStore.getState().sendSetMap({ mapKey: this.currentMapKey });

    this.setupCamera(mapData);
  }

  update(): void {
    const room = useGameRoomBridgeStore.getState().room;
    this.remotePlayers.reconcile(room, this.currentMapKey);
    this.worldObjects.reconcile();
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

  private resolveSpawn(
    mapData: ParsedTiledMap,
    data?: TiledMapSceneData
  ): { gridX: number; gridY: number } {
    if (data?.spawnGridX != null && data?.spawnGridY != null) {
      return { gridX: data.spawnGridX, gridY: data.spawnGridY };
    }
    const name = data?.spawnName ?? (this.currentMapKey === "parsedMap_village" ? "village_west_spawn" : undefined);
    if (name) {
      const s = mapData.spawns.get(name);
      if (s) return s;
    }
    const first = mapData.spawns.values().next().value;
    if (first) return first;
    return { gridX: 1, gridY: 1 };
  }

  private spawnNpcs(mapData: ParsedTiledMap): void {
    for (const p of mapData.npcs) {
      const def = getNpcDefinition(p.npc_id);
      const displayName = def?.displayName ?? p.npc_id;
      this.npcs.push(
        new Npc(this, p.npc_id, p.gridX, p.gridY, displayName, p.is_visible !== false)
      );
    }
  }

  private spawnObjects(mapData: ParsedTiledMap): void {
    for (const p of mapData.interactables) {
      this.objects.push(
        new InteractableObject(
          this,
          p.object_id,
          p.kind,
          p.label,
          p.gridX,
          p.gridY,
          p.task_id,
          undefined,
          undefined,
          p.is_visible !== false
        )
      );
    }
  }

  private spawnTransitions(mapData: ParsedTiledMap): void {
    for (const t of mapData.transitions) {
      this.objects.push(
        new InteractableObject(
          this,
          t.name,
          "transition",
          t.label ?? t.name,
          t.gridX,
          t.gridY,
          undefined,
          t.destination_map,
          t.destination_spawn,
          t.is_visible !== false
        )
      );
    }
  }

  private getEquippedState(): EquippedState {
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

  private updatePrompts(px: number, py: number): void {
    for (const npc of this.npcs) {
      npc.setInteractionPromptVisible(npc.isPlayerAdjacent(px, py));
    }
    for (const obj of this.objects) {
      obj.setInteractionPromptVisible(obj.isPlayerAdjacent(px, py));
    }
  }

  private setupCamera(mapData: ParsedTiledMap): void {
    const worldW = mapData.width * mapData.tileWidth;
    const worldH = mapData.height * mapData.tileHeight;
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.startFollow(this.playerSprite, true, 0.1, 0.1);
    this.cameras.main.setBackgroundColor("#1f2937");
  }

  private handleMovement(): void {
    const dir = keysToDirection(
      this.input_.keys.left.isDown,
      this.input_.keys.right.isDown,
      this.input_.keys.up.isDown,
      this.input_.keys.down.isDown
    );
    if (dir) this.gridMovement.tryMove(dir);
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
