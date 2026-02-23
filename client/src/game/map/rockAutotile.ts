/**
 * 4-directional autotile system for rock world objects.
 *
 * Bitmask bits: UP=1, RIGHT=2, DOWN=4, LEFT=8.
 * Each of the 16 neighbor combinations maps to a specific tileset frame index.
 */

const UP = 1;
const RIGHT = 2;
const DOWN = 4;
const LEFT = 8;

/** Bitmask (0-15) to tileset frame index for rock autotiling. */
const ROCK_BITMASK_TO_FRAME: readonly number[] = [
  97,  // 0  — isolated
  65,  // 1  — U
  69,  // 2  — R
  112, // 3  — U+R
  67,  // 4  — D
  66,  // 5  — U+D
  80,  // 6  — R+D
  96,  // 7  — U+R+D
  70,  // 8  — L
  114, // 9  — U+L
  68,  // 10 — R+L
  113, // 11 — U+R+L
  82,  // 12 — D+L
  98,  // 13 — U+D+L
  81,  // 14 — R+D+L
  97,  // 15 — U+R+D+L
];

/**
 * Per-definitionId autotile lookup tables.
 * Extend this record to add autotiling for other object types in the future.
 */
export const AUTOTILE_FRAMES: Readonly<Record<string, readonly number[]>> = {
  rock: ROCK_BITMASK_TO_FRAME,
};

/** Returns true if the given definitionId has an autotile mapping. */
export function hasAutotile(definitionId: string): boolean {
  return definitionId in AUTOTILE_FRAMES;
}

/**
 * Computes the 4-directional neighbor bitmask for a tile at (gridX, gridY).
 * @param gridX column of the tile
 * @param gridY row of the tile
 * @param occupied set of `"gridX,gridY"` keys for all tiles of the same type
 */
export function computeAutotileBitmask(
  gridX: number,
  gridY: number,
  occupied: ReadonlySet<string>
): number {
  let mask = 0;
  if (occupied.has(`${gridX},${gridY - 1}`)) mask |= UP;
  if (occupied.has(`${gridX + 1},${gridY}`)) mask |= RIGHT;
  if (occupied.has(`${gridX},${gridY + 1}`)) mask |= DOWN;
  if (occupied.has(`${gridX - 1},${gridY}`)) mask |= LEFT;
  return mask;
}

/**
 * Returns the tileset frame index for a given definitionId and neighbor bitmask.
 * Falls back to the center (all-neighbors) frame if the definition has no autotile config.
 */
export function getAutotileFrame(definitionId: string, bitmask: number): number {
  const table = AUTOTILE_FRAMES[definitionId];
  if (!table) return 97;
  return table[bitmask & 0xf]!;
}

/** Cardinal offset pairs: [dx, dy] for UP, RIGHT, DOWN, LEFT. */
export const CARDINAL_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];
