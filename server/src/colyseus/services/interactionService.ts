import type { InteractPayload } from "@odyssey/shared";
import type { MapSchema } from "@colyseus/schema";
import type { PlayerSchema, TileSchema } from "../schema/ShardState.js";
import { getToolRule } from "./toolRules.js";

interface InteractionResult {
  accepted: boolean;
  reason: string;
}

const INTERACT_COOLDOWN_MS = 90;

/**
 * Applies authoritative interaction checks and mutates player state on success.
 */
export function applyInteraction(
  player: PlayerSchema,
  tiles: MapSchema<TileSchema>,
  payload: InteractPayload,
  nowMs: number
): InteractionResult {
  const tile = tiles.get(toTileKey(payload.target.gridX, payload.target.gridY));
  if (!tile) {
    return { accepted: false, reason: "Target out of bounds" };
  }

  if (nowMs - player.lastInteractAtMs < INTERACT_COOLDOWN_MS) {
    return { accepted: false, reason: "Interaction cooldown" };
  }

  if (player.equippedToolId !== payload.toolId) {
    return { accepted: false, reason: "Tool mismatch" };
  }

  const rule = getToolRule(payload);
  if (!rule) {
    return { accepted: false, reason: "Unsupported tool action" };
  }

  if (!rule.isValidTile(tile)) {
    return { accepted: false, reason: "Invalid target tile" };
  }

  const toolLevel = resolveToolLevel(player, payload.toolId);
  if (toolLevel < rule.minUpgradeLevel) {
    return { accepted: false, reason: "Tool level too low" };
  }

  const chargeCost = payload.toolId === "watering_can" ? Math.floor(payload.chargeMs / 400) : 0;
  const totalCost = rule.baseStaminaCost + chargeCost;
  if (player.stamina < totalCost) {
    return { accepted: false, reason: "Not enough stamina" };
  }

  player.stamina -= totalCost;
  player.lastInteractAtMs = nowMs;
  applyTileMutation(tile, payload);
  return { accepted: true, reason: "ok" };
}

/**
 * Resolves the active upgrade level for the given player tool.
 */
export function resolveToolLevel(player: PlayerSchema, toolId: InteractPayload["toolId"]): number {
  if (toolId === "axe") {
    return player.axeLevel;
  }
  if (toolId === "watering_can") {
    return player.wateringCanLevel;
  }
  return player.seedsLevel;
}

function applyTileMutation(tile: TileSchema, payload: InteractPayload): void {
  if (payload.toolId === "axe") {
    const damage = 1;
    tile.objectHealth = Math.max(0, tile.objectHealth - damage);
    if (tile.objectHealth === 0) {
      tile.kind = "grass";
      tile.tilled = false;
      tile.watered = false;
      tile.hasCrop = false;
    }
    return;
  }

  if (payload.toolId === "watering_can") {
    tile.watered = true;
    return;
  }

  if (payload.toolId === "seeds") {
    tile.hasCrop = true;
    tile.watered = false;
  }
}

function toTileKey(gridX: number, gridY: number): string {
  return `${gridX},${gridY}`;
}
