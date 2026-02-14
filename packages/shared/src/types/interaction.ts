import type { ToolActionType, ToolId } from "./tool.js";

/**
 * Grid coordinate on the world tilemap.
 */
export interface TileCoordinate {
  gridX: number;
  gridY: number;
}

/**
 * Interaction payload sent from client to server.
 */
export interface InteractPayload {
  target: TileCoordinate;
  toolId: ToolId;
  actionType: ToolActionType;
  chargeMs: number;
}

/**
 * Payload for changing selected hotbar slot.
 */
export interface HotbarSelectPayload {
  slotIndex: number;
}
