import { TILE_SIZE } from "@odyssey/shared";

/**
 * Projects world coordinates to a world grid tile.
 */
export function worldToTile(worldX: number, worldY: number): { gridX: number; gridY: number } {
  return {
    gridX: Math.floor(worldX / TILE_SIZE),
    gridY: Math.floor(worldY / TILE_SIZE)
  };
}
