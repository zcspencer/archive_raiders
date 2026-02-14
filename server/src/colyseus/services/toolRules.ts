import type { InteractPayload, ToolActionType } from "@odyssey/shared";
import type { TileSchema } from "../schema/ShardState.js";

/** Required item stats for the interaction (e.g. { chop: 1 }). */
export type HandStats = Record<string, number> | undefined;

export interface ToolRule {
  actionType: ToolActionType;
  /** Equippable item must have these stats (e.g. { chop: 1 }). */
  requiredStat: Record<string, number>;
  baseStaminaCost: number;
  isValidTile: (tile: TileSchema) => boolean;
}

const TOOL_RULES: ToolRule[] = [
  {
    actionType: "primary",
    requiredStat: { chop: 1 },
    baseStaminaCost: 2,
    isValidTile: (tile) =>
      (tile.kind === "tree" || tile.kind === "rock") && tile.objectHealth > 0
  },
  {
    actionType: "primary",
    requiredStat: { water: 1 },
    baseStaminaCost: 1,
    isValidTile: (tile) => tile.tilled
  },
  {
    actionType: "primary",
    requiredStat: { plant: 1 },
    baseStaminaCost: 1,
    isValidTile: (tile) => tile.tilled && !tile.hasCrop
  }
];

function hasRequiredStats(handStats: HandStats, required: Record<string, number>): boolean {
  if (!handStats) return false;
  for (const [key, minVal] of Object.entries(required)) {
    if ((handStats[key] ?? 0) < minVal) return false;
  }
  return true;
}

/**
 * Returns the rule for this payload if the equipped hand item has the required stats.
 */
export function getToolRule(payload: InteractPayload, handStats: HandStats): ToolRule | null {
  const rule = TOOL_RULES.find(
    (r) =>
      r.actionType === payload.actionType && hasRequiredStats(handStats, r.requiredStat)
  );
  return rule ?? null;
}
