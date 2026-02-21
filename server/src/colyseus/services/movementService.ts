import type { MovePayload } from "@odyssey/shared";
import type { PlayerSchema } from "../schema/ShardState.js";

const MIN_GRID = 0;
const MAX_GRID = 31;

/**
 * Predicate that returns true when a grid cell is blocked (e.g. by a world object).
 */
export type TileBlockedFn = (gridX: number, gridY: number) => boolean;

/**
 * Applies bounded movement updates to the authoritative player state.
 * When {@link isBlocked} is provided and returns true for the target tile,
 * the move is rejected and the player stays at their current position.
 */
export function applyMove(
  player: PlayerSchema,
  payload: MovePayload,
  isBlocked?: TileBlockedFn
): void {
  const targetX = clamp(payload.gridX, MIN_GRID, MAX_GRID);
  const targetY = clamp(payload.gridY, MIN_GRID, MAX_GRID);
  if (isBlocked?.(targetX, targetY)) return;
  player.gridX = targetX;
  player.gridY = targetY;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
