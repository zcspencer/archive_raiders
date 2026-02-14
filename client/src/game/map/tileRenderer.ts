import Phaser from "phaser";
import { TILE_SIZE } from "@odyssey/shared";

/**
 * Color palette for ground tile ids.
 * 0 = transparent, 1 = grass, 2 = path, 3 = water/wall, 4 = building, 5 = pond, 6 = flowers.
 */
const TILE_COLORS: Record<number, number> = {
  0: 0x111827,
  1: 0x4ade80,
  2: 0xd4a373,
  3: 0x3b82f6,
  4: 0x78716c,
  5: 0x38bdf8,
  6: 0xfbbf24
};

/**
 * Generates a runtime texture atlas containing one colored square per tile id.
 * Call during the scene's `create()` phase.
 */
export function generateTilesetTexture(scene: Phaser.Scene): void {
  const ids = Object.keys(TILE_COLORS).map(Number);
  const cols = ids.length;
  const gfx = scene.add.graphics();
  gfx.setVisible(false);

  for (let i = 0; i < cols; i++) {
    const color = TILE_COLORS[ids[i]!] ?? 0x111827;
    gfx.fillStyle(color, 1);
    gfx.fillRect(i * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);
  }

  gfx.generateTexture("village_tiles", cols * TILE_SIZE, TILE_SIZE);
  gfx.destroy();

  /* Register individual frames so we can reference by tile id. */
  const texture = scene.textures.get("village_tiles");
  for (let i = 0; i < cols; i++) {
    texture.add(ids[i]!, 0, i * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);
  }
}

/**
 * Renders the ground layer as a grid of tile images.
 * Returns the created container for depth-sorting.
 */
export function renderGroundLayer(
  scene: Phaser.Scene,
  groundData: number[],
  mapWidth: number,
  mapHeight: number
): Phaser.GameObjects.Container {
  const container = scene.add.container(0, 0);
  container.setDepth(-1);

  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      const tileId = groundData[y * mapWidth + x] ?? 0;
      const img = scene.add.image(
        x * TILE_SIZE + TILE_SIZE / 2,
        y * TILE_SIZE + TILE_SIZE / 2,
        "village_tiles",
        tileId
      );
      container.add(img);
    }
  }

  return container;
}
