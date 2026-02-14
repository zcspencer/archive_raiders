import type { ToolId, ToolUpgradeLevel } from "./tool.js";

/**
 * Runtime item instance (one stack in inventory or inside a container).
 * containedItems is populated when this instance has the Container component.
 */
export interface ItemInstance {
  instanceId: string;
  definitionId: string;
  definitionVersion: number;
  quantity: number;
  containedItems?: ItemInstance[];
}

/**
 * An item stack in player inventory.
 * @deprecated Prefer ItemInstance for new code. Retained for migration.
 */
export interface InventoryStack {
  itemId: string;
  quantity: number;
}

/**
 * Tool state tracked for gameplay checks.
 */
export interface PlayerToolState {
  toolId: ToolId;
  upgradeLevel: ToolUpgradeLevel;
}

/**
 * One hotbar slot with optional equipped tool.
 */
export interface HotbarSlot {
  slotIndex: number;
  toolId: ToolId | null;
}
