import type { TiledObject, TiledPoint } from "@odyssey/shared";

/**
 * Rasterizes Tiled collision objects (polygons, ellipses, rectangles) into a
 * boolean grid. Cells not covered by any collision shape are walkable (true).
 */

/**
 * Returns true when (px, py) is inside the polygon. Polygon points are
 * object-relative; objX/objY are the object's position.
 */
function pointInPolygon(
  px: number,
  py: number,
  objX: number,
  objY: number,
  polygon: TiledPoint[]
): boolean {
  const n = polygon.length;
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const pi = polygon[i]!;
    const pj = polygon[j]!;
    const xi = objX + pi.x;
    const yi = objY + pi.y;
    const xj = objX + pj.x;
    const yj = objY + pj.y;

    const intersect =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Returns true when (px, py) is inside the ellipse centered at (cx, cy)
 * with half-width rx and half-height ry.
 */
function pointInEllipse(
  px: number,
  py: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number
): boolean {
  const dx = (px - cx) / rx;
  const dy = (py - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

/**
 * Returns true when (px, py) is inside the axis-aligned rectangle.
 */
function pointInRect(
  px: number,
  py: number,
  x: number,
  y: number,
  w: number,
  h: number
): boolean {
  return px >= x && px <= x + w && py >= y && py <= y + h;
}

/**
 * Checks if a grid cell center falls inside the given Tiled object.
 * Tiled uses top-left origin; y increases downward.
 */
function cellInObject(
  cellCenterX: number,
  cellCenterY: number,
  obj: TiledObject
): boolean {
  if (obj.polygon && obj.polygon.length >= 3) {
    return pointInPolygon(
      cellCenterX,
      cellCenterY,
      obj.x,
      obj.y,
      obj.polygon
    );
  }
  if (obj.ellipse) {
    const cx = obj.x + obj.width / 2;
    const cy = obj.y + obj.height / 2;
    const rx = obj.width / 2;
    const ry = obj.height / 2;
    return pointInEllipse(cellCenterX, cellCenterY, cx, cy, rx, ry);
  }
  return pointInRect(
    cellCenterX,
    cellCenterY,
    obj.x,
    obj.y,
    obj.width,
    obj.height
  );
}

/**
 * Rasterizes collision objects into a grid. Cells whose center falls inside
 * any collision object are blocked (false). All others are walkable (true).
 *
 * @param objects - Tiled object layer objects (polygons, ellipses, rectangles)
 * @param mapWidth - Map width in tiles
 * @param mapHeight - Map height in tiles
 * @param tileWidth - Tile width in pixels
 * @param tileHeight - Tile height in pixels
 * @returns 2D grid where grid[y][x] === true means walkable
 */
export function rasterizeCollision(
  objects: TiledObject[],
  mapWidth: number,
  mapHeight: number,
  tileWidth: number,
  tileHeight: number
): boolean[][] {
  const grid: boolean[][] = [];
  for (let gy = 0; gy < mapHeight; gy++) {
    const row: boolean[] = [];
    for (let gx = 0; gx < mapWidth; gx++) {
      const cellCenterX = gx * tileWidth + tileWidth / 2;
      const cellCenterY = gy * tileHeight + tileHeight / 2;

      let blocked = false;
      for (const obj of objects) {
        if (obj.visible === false) continue;
        if (cellInObject(cellCenterX, cellCenterY, obj)) {
          blocked = true;
          break;
        }
      }
      row.push(!blocked);
    }
    grid.push(row);
  }
  return grid;
}
