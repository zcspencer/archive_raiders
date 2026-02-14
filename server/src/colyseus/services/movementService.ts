import type { MovePayload } from "@odyssey/shared";
import type { PlayerSchema } from "../schema/ShardState.js";

const MIN_GRID = 0;
const MAX_GRID = 31;

/**
 * Applies bounded movement updates to the authoritative player state.
 */
export function applyMove(player: PlayerSchema, payload: MovePayload): void {
  player.gridX = clamp(payload.gridX, MIN_GRID, MAX_GRID);
  player.gridY = clamp(payload.gridY, MIN_GRID, MAX_GRID);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
