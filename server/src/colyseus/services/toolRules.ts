import type { InteractPayload, ToolActionType, ToolId, ToolUpgradeLevel } from "@odyssey/shared";
import type { TileSchema } from "../schema/ShardState.js";

interface ToolRule {
  toolId: ToolId;
  actionType: ToolActionType;
  minUpgradeLevel: ToolUpgradeLevel;
  baseStaminaCost: number;
  isValidTile: (tile: TileSchema) => boolean;
}

/**
 * Looks up the canonical rule for a tool interaction.
 */
export function getToolRule(payload: InteractPayload): ToolRule | null {
  const rules: ToolRule[] = [
    {
      toolId: "axe",
      actionType: "primary",
      minUpgradeLevel: 0,
      baseStaminaCost: 2,
      isValidTile: (tile) =>
        (tile.kind === "tree" || tile.kind === "rock") && tile.objectHealth > 0
    },
    {
      toolId: "watering_can",
      actionType: "primary",
      minUpgradeLevel: 0,
      baseStaminaCost: 1,
      isValidTile: (tile) => tile.tilled
    },
    {
      toolId: "seeds",
      actionType: "primary",
      minUpgradeLevel: 0,
      baseStaminaCost: 1,
      isValidTile: (tile) => tile.tilled && !tile.hasCrop
    }
  ];
  return (
    rules.find(
      (rule) => rule.toolId === payload.toolId && rule.actionType === payload.actionType
    ) ?? null
  );
}
