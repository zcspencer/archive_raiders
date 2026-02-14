import type { ToolId, ToolUpgradeLevel } from "./tool.js";

/**
 * An item stack in player inventory.
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
