/**
 * Boolean grid tracking which tiles are walkable.
 */
export class CollisionGrid {
  private readonly grid: boolean[];
  private readonly width: number;
  private readonly height: number;

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
   * Out-of-bounds coordinates are treated as blocked.
   */
  isWalkable(gridX: number, gridY: number): boolean {
    if (gridX < 0 || gridY < 0 || gridX >= this.width || gridY >= this.height) {
      return false;
    }
    return this.grid[gridY * this.width + gridX] ?? false;
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
