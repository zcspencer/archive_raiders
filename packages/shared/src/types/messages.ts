export enum ClientMessage {
  Move = "move",
  SetMap = "set-map",
  Interact = "interact",
  SelectHotbar = "select-hotbar",
  Chat = "chat",
  OpenContainer = "open-container",
  ClaimContainer = "claim-container",
  EquipItem = "equip-item",
  UnequipItem = "unequip-item",
  DropItem = "drop-item",
  UseItem = "use-item"
}

export enum ServerMessage {
  TaskTrigger = "task-trigger",
  TaskResult = "task-result",
  Notification = "notification",
  InventoryUpdate = "inventory-update",
  EquipmentUpdate = "equipment-update",
  CurrencyUpdate = "currency-update",
  ContainerContents = "container-contents"
}

/**
 * Movement payload sent by the client.
 */
export interface MovePayload {
  gridX: number;
  gridY: number;
}

/**
 * Map context payload sent by the client when entering a scene/map.
 */
export interface SetMapPayload {
  mapKey: string;
}
