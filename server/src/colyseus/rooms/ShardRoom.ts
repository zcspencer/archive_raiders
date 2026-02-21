import { Client, Room } from "colyseus";
import {
  ClientMessage,
  ServerMessage,
  attackTargetPayloadSchema,
  claimContainerPayloadSchema,
  dropItemPayloadSchema,
  equipItemPayloadSchema,
  movePayloadSchema,
  setMapPayloadSchema,
  openContainerPayloadSchema,
  unequipItemPayloadSchema
} from "@odyssey/shared";
import { PlayerSchema, ShardState, spawnWorldObjectsForMap, worldObjectKey } from "../schema/ShardState.js";
import { calculateDamage, canAttack, isInRange } from "../services/damageService.js";
import { applyMove } from "../services/movementService.js";
import {
  findFirstInstanceByDefinitionId,
  findInstanceInTree,
  getDestroyableDrops,
  getDestroyableHealth
} from "./inventoryTreeUtils.js";
import { type RoomServices, type JoinAuthContext, getHandEquippableParams, syncPlayerEquipment } from "./roomServices.js";

interface JoinOptions {
  accessToken?: string;
  classroomId?: string;
}

/**
 * Classroom shard room — one instance per classroom.
 * Handles real-time movement, interactions, inventory, equipment, and containers.
 */
export class ShardRoom extends Room<ShardState> {
  private static services: RoomServices | null = null;

  /**
   * Configures room-level service dependencies (called once at server boot).
   */
  static configureServices(services: RoomServices): void {
    ShardRoom.services = services;
  }

  private getServices(): RoomServices {
    if (!ShardRoom.services) {
      throw new Error("ShardRoom services are not configured");
    }
    return ShardRoom.services;
  }

  override onCreate(options: JoinOptions): void {
    const classroomId = options.classroomId ?? "default-classroom";
    this.setState(new ShardState(classroomId));
    const { itemDefinitionLoader, mapPlacements } = this.getServices();
    const getHealth = (id: string) => getDestroyableHealth(itemDefinitionLoader, id);
    for (const [mapKey, placements] of mapPlacements) {
      spawnWorldObjectsForMap(this.state.worldObjects, mapKey, placements, getHealth);
    }
    this.registerMessageHandlers();
  }

  override async onAuth(
    _client: Client,
    options: JoinOptions
  ): Promise<JoinAuthContext> {
    if (!options.accessToken) {
      throw new Error("Missing access token");
    }
    if (!options.classroomId) {
      throw new Error("Missing classroom id");
    }

    const { authService, classroomService } = this.getServices();
    const user = authService.getUserFromAccessToken(options.accessToken);
    if (!user) {
      throw new Error("Invalid token");
    }

    const allowed = await classroomService.isUserInClassroom(user, options.classroomId);
    if (!allowed) {
      throw new Error("Classroom access denied");
    }

    return { user, classroomId: options.classroomId };
  }

  override async onJoin(client: Client): Promise<void> {
    const authContext = client.auth as JoinAuthContext | undefined;
    if (!authContext) {
      throw new Error("Missing auth context");
    }
    if (authContext.classroomId !== this.state.classroomId) {
      throw new Error("Classroom mismatch for room join");
    }

    const player = new PlayerSchema();
    player.id = authContext.user.id;
    player.gridX = 10;
    player.gridY = 10;
    player.stamina = 100;
    player.maxStamina = 100;
    player.lastAttackAtMs = 0;
    player.equippedHandItemId = "";
    player.equippedHeadItemId = "";
    player.equippedHandDefId = "";
    player.equippedHeadDefId = "";
    player.currentMapKey = "parsedMap_village";
    this.state.players.set(client.sessionId, player);

    const { inventoryService, equipmentService } = this.getServices();
    const inventory = await inventoryService.getInventory(authContext.user.id);
    if (inventory.length === 0) {
      try {
        await inventoryService.addItems(authContext.user.id, [
          { definitionId: "axe", quantity: 1 },
          { definitionId: "watering-can", quantity: 1 },
          { definitionId: "seeds-bag", quantity: 1 }
        ]);
        const after = await inventoryService.getInventory(authContext.user.id);
        const axeItem = findFirstInstanceByDefinitionId(after, "axe");
        if (axeItem) {
          await equipmentService.equip(authContext.user.id, axeItem.instanceId, "hand");
        }
      } catch (err: unknown) {
        const pgCode = (err as { code?: string }).code;
        if (pgCode !== "23505") throw err;
      }
    }
    await syncPlayerEquipment(this.getServices(), this.state, client.sessionId, authContext.user.id);

    const finalInventory = await inventoryService.getInventory(authContext.user.id);
    const balances = await this.getServices().currencyService.getBalances(authContext.user.id);
    const equipment = await equipmentService.getEquipment(authContext.user.id);
    client.send(ServerMessage.InventoryUpdate, finalInventory);
    client.send(ServerMessage.CurrencyUpdate, balances);
    client.send(ServerMessage.EquipmentUpdate, equipment);
  }

  override onLeave(client: Client): void {
    this.state.players.delete(client.sessionId);
  }

  /**
   * Registers all client-to-server message handlers on room creation.
   */
  private registerMessageHandlers(): void {
    this.onMessage(ClientMessage.Move, (client, rawPayload: unknown) => {
      const payloadResult = movePayloadSchema.safeParse(rawPayload);
      if (!payloadResult.success) {
        client.send(ServerMessage.Notification, "Invalid move payload");
        return;
      }
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      applyMove(player, payloadResult.data, (gx, gy) =>
        this.state.worldObjects.has(worldObjectKey(player.currentMapKey, gx, gy))
      );
    });

    this.onMessage(ClientMessage.SetMap, (client, rawPayload: unknown) => {
      const payloadResult = setMapPayloadSchema.safeParse(rawPayload);
      if (!payloadResult.success) {
        client.send(ServerMessage.Notification, "Invalid set-map payload");
        return;
      }
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      player.currentMapKey = payloadResult.data.mapKey;
    });

    this.onMessage(ClientMessage.AttackTarget, async (client, rawPayload: unknown) => {
      const payloadResult = attackTargetPayloadSchema.safeParse(rawPayload);
      if (!payloadResult.success) {
        client.send(ServerMessage.Notification, "Invalid attack payload");
        return;
      }
      const { gridX, gridY } = payloadResult.data;
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      const authContext = client.auth as JoinAuthContext | undefined;
      if (!authContext) return;

      const params = await getHandEquippableParams(this.getServices(), authContext.user.id);
      if (!params || params.baseDamage <= 0) {
        client.send(ServerMessage.Notification, "Equip a weapon to attack");
        return;
      }

      const nowMs = Date.now();
      if (!canAttack(player.lastAttackAtMs, params.rate, nowMs)) {
        client.send(ServerMessage.Notification, "Attack too soon");
        return;
      }

      if (!isInRange(player.gridX, player.gridY, gridX, gridY, params.range)) {
        client.send(ServerMessage.Notification, "Target out of range");
        return;
      }

      const key = worldObjectKey(player.currentMapKey, gridX, gridY);
      const worldObj = this.state.worldObjects.get(key);
      if (!worldObj) {
        client.send(ServerMessage.Notification, "Nothing to attack");
        return;
      }

      const def = this.getServices().itemDefinitionLoader.getDefinition(worldObj.definitionId);
      const targetTags = def?.tags ?? [];
      const damage = calculateDamage(
        { baseDamage: params.baseDamage, tagModifiers: params.tagModifiers, rate: params.rate, range: params.range },
        targetTags
      );
      if (damage <= 0) return;

      player.lastAttackAtMs = nowMs;
      worldObj.health = Math.max(0, worldObj.health - damage);

      this.broadcast(ServerMessage.ObjectDamaged, {
        objectId: key,
        newHealth: worldObj.health,
        maxHealth: worldObj.maxHealth,
        damage
      });

      if (worldObj.health <= 0) {
        const drops = getDestroyableDrops(this.getServices().itemDefinitionLoader, worldObj.definitionId);
        if (drops && drops.length > 0) {
          const resolved = this.getServices().lootResolver.resolve(drops, () => Math.random());
          if (resolved.length > 0) {
            await this.getServices().inventoryService.addItems(
              authContext.user.id,
              resolved.map((r) => ({ definitionId: r.definitionId, quantity: r.quantity }))
            );
            const updated = await this.getServices().inventoryService.getInventory(authContext.user.id);
            client.send(ServerMessage.InventoryUpdate, updated);

            const { itemDefinitionLoader } = this.getServices();
            const previewItems = resolved.map((r) => {
              const itemDef = itemDefinitionLoader.getDefinition(r.definitionId);
              return {
                definitionId: r.definitionId,
                name: itemDef?.name ?? r.definitionId,
                quantity: r.quantity,
                rarity: itemDef?.rarity ?? "Common"
              };
            });
            client.send(ServerMessage.LootDropPreview, { items: previewItems });
          } else {
            client.send(ServerMessage.Notification, "You found nothing.");
          }
        }
        this.state.worldObjects.delete(key);
        this.broadcast(ServerMessage.ObjectDestroyed, { objectId: key });
      }
    });

    this.onMessage(ClientMessage.OpenContainer, async (client, rawPayload: unknown) => {
      const payloadResult = openContainerPayloadSchema.safeParse(rawPayload);
      if (!payloadResult.success) {
        client.send(ServerMessage.Notification, "Invalid open-container payload");
        return;
      }
      const authContext = client.auth as JoinAuthContext | undefined;
      if (!authContext) return;
      const { containerService } = this.getServices();
      try {
        const result = await containerService.openContainer(authContext.user.id, payloadResult.data.objectId);
        client.send(ServerMessage.ContainerContents, {
          objectId: payloadResult.data.objectId,
          nonce: result.nonce,
          items: result.items,
          currencyRewards: result.currencyRewards
        });
      } catch (err) {
        client.send(ServerMessage.Notification, err instanceof Error ? err.message : "Failed to open container");
      }
    });

    this.onMessage(ClientMessage.EquipItem, async (client, rawPayload: unknown) => {
      const payloadResult = equipItemPayloadSchema.safeParse(rawPayload);
      if (!payloadResult.success) {
        client.send(ServerMessage.Notification, "Invalid equip payload");
        return;
      }
      const authContext = client.auth as JoinAuthContext | undefined;
      if (!authContext) return;
      const { inventoryService, equipmentService, itemDefinitionLoader } = this.getServices();
      const inventory = await inventoryService.getInventory(authContext.user.id);
      const item = findInstanceInTree(inventory, payloadResult.data.instanceId);
      if (!item) {
        client.send(ServerMessage.Notification, "Item not found");
        return;
      }
      const def = itemDefinitionLoader.getDefinition(item.definitionId);
      const comp = def?.components?.find((c) => c.typeId === "Equippable" || c.typeId === "Cosmetic");
      const slot = (comp?.params as { slot?: string } | undefined)?.slot;
      if (slot !== "hand" && slot !== "head") {
        client.send(ServerMessage.Notification, "Item is not equippable");
        return;
      }
      await equipmentService.equip(authContext.user.id, payloadResult.data.instanceId, slot);
      await syncPlayerEquipment(this.getServices(), this.state, client.sessionId, authContext.user.id);
      const updated = await inventoryService.getInventory(authContext.user.id);
      const equipment = await equipmentService.getEquipment(authContext.user.id);
      client.send(ServerMessage.InventoryUpdate, updated);
      client.send(ServerMessage.EquipmentUpdate, equipment);
    });

    this.onMessage(ClientMessage.UnequipItem, async (client, rawPayload: unknown) => {
      const payloadResult = unequipItemPayloadSchema.safeParse(rawPayload);
      if (!payloadResult.success) {
        client.send(ServerMessage.Notification, "Invalid unequip payload");
        return;
      }
      const authContext = client.auth as JoinAuthContext | undefined;
      if (!authContext) return;
      const { equipmentService, inventoryService } = this.getServices();
      await equipmentService.unequip(authContext.user.id, payloadResult.data.slot);
      await syncPlayerEquipment(this.getServices(), this.state, client.sessionId, authContext.user.id);
      const updated = await inventoryService.getInventory(authContext.user.id);
      const equipment = await equipmentService.getEquipment(authContext.user.id);
      client.send(ServerMessage.InventoryUpdate, updated);
      client.send(ServerMessage.EquipmentUpdate, equipment);
    });

    this.onMessage(ClientMessage.DropItem, async (client, rawPayload: unknown) => {
      const payloadResult = dropItemPayloadSchema.safeParse(rawPayload);
      if (!payloadResult.success) {
        client.send(ServerMessage.Notification, "Invalid drop payload");
        return;
      }
      const authContext = client.auth as JoinAuthContext | undefined;
      if (!authContext) return;
      const { itemActionResolver, inventoryService } = this.getServices();
      const result = await itemActionResolver.executeAction(authContext.user.id, payloadResult.data.instanceId, "drop");
      if (!result.success) {
        client.send(ServerMessage.Notification, result.reason ?? "Cannot drop item");
        return;
      }
      await syncPlayerEquipment(this.getServices(), this.state, client.sessionId, authContext.user.id);
      const updated = await inventoryService.getInventory(authContext.user.id);
      client.send(ServerMessage.InventoryUpdate, updated);
    });

    this.onMessage(ClientMessage.ClaimContainer, async (client, rawPayload: unknown) => {
      const payloadResult = claimContainerPayloadSchema.safeParse(rawPayload);
      if (!payloadResult.success) {
        client.send(ServerMessage.Notification, "Invalid claim-container payload");
        return;
      }
      const authContext = client.auth as JoinAuthContext | undefined;
      if (!authContext) return;
      const { containerService, inventoryService, currencyService } = this.getServices();
      try {
        await containerService.claimContainer(authContext.user.id, payloadResult.data.objectId, payloadResult.data.nonce);
        const inventory = await inventoryService.getInventory(authContext.user.id);
        const balances = await currencyService.getBalances(authContext.user.id);
        client.send(ServerMessage.InventoryUpdate, inventory);
        client.send(ServerMessage.CurrencyUpdate, balances);
      } catch (err) {
        client.send(ServerMessage.Notification, err instanceof Error ? err.message : "Failed to claim container");
      }
    });
  }
}
