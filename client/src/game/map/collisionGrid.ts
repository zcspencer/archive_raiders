/**
 * Boolean grid tracking which tiles are walkable.
 * Supports a dynamic overlay for runtime blockers (e.g. world objects)
 * that is independent of the static collision layer.
 */
export class CollisionGrid {
  private readonly grid: boolean[];
  private readonly width: number;
  private readonly height: number;
  private readonly dynamicBlocked = new Set<number>();

  /**
   * @param width  - Map width in tiles.
   * @param height - Map height in tiles.
   * @param collisionData - Flat array of tile ids from the collision layer.
   *   A value of 0 means walkable; any non-zero value means blocked.
   */
  constructor(width: number, height: number, collisionData: number[]) {
    this.width = width;
    this.height = height;
    this.grid = collisionData.map((id) => id === 0);
  }

  /**
   * Returns true when the tile at (gridX, gridY) can be walked on.
   * A tile is blocked if the static layer marks it blocked OR a dynamic blocker is present.
   * Out-of-bounds coordinates are treated as blocked.
   */
  isWalkable(gridX: number, gridY: number): boolean {
    if (gridX < 0 || gridY < 0 || gridX >= this.width || gridY >= this.height) {
      return false;
    }
    const idx = gridY * this.width + gridX;
    if (this.dynamicBlocked.has(idx)) return false;
    return this.grid[idx] ?? false;
  }

  /** Mark a tile as dynamically blocked (e.g. occupied by a world object). */
  blockTile(gridX: number, gridY: number): void {
    if (gridX >= 0 && gridY >= 0 && gridX < this.width && gridY < this.height) {
      this.dynamicBlocked.add(gridY * this.width + gridX);
    }
  }

  /** Remove a dynamic blocker, restoring the tile to its static walkability. */
  unblockTile(gridX: number, gridY: number): void {
    if (gridX >= 0 && gridY >= 0 && gridX < this.width && gridY < this.height) {
      this.dynamicBlocked.delete(gridY * this.width + gridX);
    }
  }

  /** Map width in tiles. */
  getWidth(): number {
    return this.width;
  }

  /** Map height in tiles. */
  getHeight(): number {
    return this.height;
  }
}
