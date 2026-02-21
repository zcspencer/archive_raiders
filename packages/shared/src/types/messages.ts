/**
 * Message types sent from the client to the server over the Colyseus room connection.
 * This enum is additive-only; existing values must not be renamed or removed.
 */
export enum ClientMessage {
  Move = "move",
  SetMap = "set-map",
  /** @deprecated Replaced by AttackTarget for damage; do not remove. */
  Interact = "interact",
  /** @deprecated Toolbar/hotbar removed; use EquipItem from inventory instead. */
  SelectHotbar = "select-hotbar",
  Chat = "chat",
  OpenContainer = "open-container",
  ClaimContainer = "claim-container",
  EquipItem = "equip-item",
  UnequipItem = "unequip-item",
  DropItem = "drop-item",
  UseItem = "use-item",
  AttackTarget = "attack-target"
}

/**
 * Message types sent from the server to the client over the Colyseus room connection.
 * This enum is additive-only; existing values must not be renamed or removed.
 */
export enum ServerMessage {
  TaskTrigger = "task-trigger",
  TaskResult = "task-result",
  Notification = "notification",
  InventoryUpdate = "inventory-update",
  EquipmentUpdate = "equipment-update",
  CurrencyUpdate = "currency-update",
  ContainerContents = "container-contents",
  ObjectDamaged = "object-damaged",
  ObjectDestroyed = "object-destroyed",
  LootDropPreview = "loot-drop-preview"
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

/**
 * Attack target payload: tile to apply damage to (when holding an equippable with baseDamage > 0).
 */
export interface AttackTargetPayload {
  gridX: number;
  gridY: number;
}

/**
 * Broadcast when a world object takes damage.
 */
export interface ObjectDamagedPayload {
  objectId: string;
  newHealth: number;
  maxHealth: number;
  damage: number;
}

/**
 * Broadcast when a world object is destroyed (health reaches 0).
 */
export interface ObjectDestroyedPayload {
  objectId: string;
}

/**
 * Sent to the attacker when a destroyed world object drops loot.
 * Items are already granted; the client shows a preview panel.
 */
export interface LootDropPreviewPayload {
  items: Array<{
    definitionId: string;
    name: string;
    quantity: number;
    rarity?: string;
  }>;
}
