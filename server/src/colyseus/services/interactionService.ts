import type { InteractPayload } from "@odyssey/shared";
import type { MapSchema } from "@colyseus/schema";
import type { PlayerSchema, TileSchema } from "../schema/ShardState.js";
import { getToolRule, type HandStats, type ToolRule } from "./toolRules.js";

interface InteractionResult {
  accepted: boolean;
  reason: string;
}

const INTERACT_COOLDOWN_MS = 90;

/**
 * Applies authoritative interaction checks and mutates player state on success.
 * handStats: stats from the equipped hand item (Equippable params.stats); undefined if nothing equipped.
 */
export function applyInteraction(
  player: PlayerSchema,
  tiles: MapSchema<TileSchema>,
  payload: InteractPayload,
  nowMs: number,
  handStats: HandStats
): InteractionResult {
  const tile = tiles.get(toTileKey(payload.target.gridX, payload.target.gridY));
  if (!tile) {
    return { accepted: false, reason: "Target out of bounds" };
  }

  if (nowMs - player.lastInteractAtMs < INTERACT_COOLDOWN_MS) {
    return { accepted: false, reason: "Interaction cooldown" };
  }

  const rule = getToolRule(payload, handStats);
  if (!rule) {
    return { accepted: false, reason: "Unsupported tool or wrong equipment" };
  }

  if (!rule.isValidTile(tile)) {
    return { accepted: false, reason: "Invalid target tile" };
  }

  const chargeCost = handStats?.water ? Math.floor(payload.chargeMs / 400) : 0;
  const totalCost = rule.baseStaminaCost + chargeCost;
  if (player.stamina < totalCost) {
    return { accepted: false, reason: "Not enough stamina" };
  }

  player.stamina -= totalCost;
  player.lastInteractAtMs = nowMs;
  applyTileMutation(tile, rule);
  return { accepted: true, reason: "ok" };
}

function applyTileMutation(tile: TileSchema, rule: ToolRule): void {
  if (rule.requiredStat.chop) {
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
  if (rule.requiredStat.water) {
    tile.watered = true;
    return;
  }
  if (rule.requiredStat.plant) {
    tile.hasCrop = true;
    tile.watered = false;
  }
}

function toTileKey(gridX: number, gridY: number): string {
  return `${gridX},${gridY}`;
}
