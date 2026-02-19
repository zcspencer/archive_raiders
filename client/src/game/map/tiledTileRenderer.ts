import Phaser from "phaser";
import type { ParsedTiledMap } from "./TiledMapParser";

/** Tiled encodes flip flags in the upper bits of the gid. Mask to get tile index. */
const GID_MASK = 0x1fffffff;

/**
 * Renders tile layers from a ParsedTiledMap using the tileset spritesheet.
 * Only renders non-empty tiles (gid > 0).
 */
export function renderTiledLayers(
  scene: Phaser.Scene,
  map: ParsedTiledMap
): { ground: Phaser.GameObjects.Container; detailDown: Phaser.GameObjects.Container; detailUp: Phaser.GameObjects.Container } {
  const tw = map.tileWidth;
  const th = map.tileHeight;

  const ground = scene.add.container(0, 0);
  ground.setDepth(0);

  const detailDown = scene.add.container(0, 0);
  detailDown.setDepth(1);

  const detailUp = scene.add.container(0, 0);
  detailUp.setDepth(10);

  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const idx = y * map.width + x;

      const gGround = (map.groundData[idx] ?? 0) >>> 0;
      const gDown = (map.detailDownData[idx] ?? 0) >>> 0;
      const gUp = (map.detailUpData[idx] ?? 0) >>> 0;

      const wx = x * tw + tw / 2;
      const wy = y * th + th / 2;

      addTileIfPresent(scene, ground, gGround, map.firstGid, wx, wy);
      addTileIfPresent(scene, detailDown, gDown, map.firstGid, wx, wy);
      addTileIfPresent(scene, detailUp, gUp, map.firstGid, wx, wy);
    }
  }

  return { ground, detailDown, detailUp };
}

function addTileIfPresent(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  gid: number,
  firstGid: number,
  worldX: number,
  worldY: number
): void {
  const raw = gid & GID_MASK;
  if (raw < firstGid) return;

  const frameIndex = raw - firstGid;
  const img = scene.add.image(worldX, worldY, "tileset_main", frameIndex);
  container.add(img);
}
