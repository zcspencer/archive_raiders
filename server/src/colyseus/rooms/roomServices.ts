import type { AuthUser } from "@odyssey/shared";
import type { AuthService } from "../../auth/AuthService.js";
import type { ClassroomService } from "../../classroom/ClassroomService.js";
import type { ContainerService } from "../../inventory/ContainerService.js";
import type { CurrencyService } from "../../inventory/CurrencyService.js";
import type { EquipmentService } from "../../inventory/EquipmentService.js";
import type { InventoryService } from "../../inventory/InventoryService.js";
import type { ItemActionResolver } from "../../inventory/ItemActionResolver.js";
import type { ItemDefinitionLoader } from "../../inventory/ItemDefinitionLoader.js";
import type { ShardState } from "../schema/ShardState.js";
import { findDefinitionIdInTree, getEquippableStats } from "./inventoryTreeUtils.js";

/**
 * Service dependencies injected into ShardRoom.
 */
export interface RoomServices {
  authService: AuthService;
  classroomService: ClassroomService;
  containerService: ContainerService;
  inventoryService: InventoryService;
  currencyService: CurrencyService;
  equipmentService: EquipmentService;
  itemActionResolver: ItemActionResolver;
  itemDefinitionLoader: ItemDefinitionLoader;
}

/**
 * Auth context attached to each client after onAuth succeeds.
 */
export interface JoinAuthContext {
  user: AuthUser;
  classroomId: string;
}

/**
 * Reads current equipment from the DB and syncs it into the Colyseus PlayerSchema.
 */
export async function syncPlayerEquipment(
  services: RoomServices,
  state: ShardState,
  sessionId: string,
  userId: string
): Promise<void> {
  const player = state.players.get(sessionId);
  if (!player) return;
  const equipment = await services.equipmentService.getEquipment(userId);
  const inventory = await services.inventoryService.getInventory(userId);
  const handDefId = equipment.hand ? findDefinitionIdInTree(inventory, equipment.hand) ?? "" : "";
  const headDefId = equipment.head ? findDefinitionIdInTree(inventory, equipment.head) ?? "" : "";
  player.equippedHandItemId = equipment.hand ?? "";
  player.equippedHeadItemId = equipment.head ?? "";
  player.equippedHandDefId = handDefId;
  player.equippedHeadDefId = headDefId;
}

/**
 * Returns the Equippable stats for whatever item is currently in the player's hand slot.
 */
export async function getHandStats(services: RoomServices, userId: string): Promise<Record<string, number> | undefined> {
  const equipment = await services.equipmentService.getEquipment(userId);
  if (!equipment.hand) return undefined;
  const inventory = await services.inventoryService.getInventory(userId);
  const definitionId = findDefinitionIdInTree(inventory, equipment.hand);
  if (!definitionId) return undefined;
  return getEquippableStats(services.itemDefinitionLoader, definitionId);
}
