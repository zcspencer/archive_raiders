import Phaser from "phaser";
import { TILE_SIZE } from "@odyssey/shared";

const BODY_COLOR = 0xa3e635;
const EYE_COLOR = 0x1e293b;
const FRAME_COUNT = 2;

/**
 * Animation keys for each facing direction.
 */
export const WALK_ANIMS = {
  down: "player_walk_down",
  up: "player_walk_up",
  left: "player_walk_left",
  right: "player_walk_right"
} as const;

/**
 * Idle frame index per direction (first frame of that row).
 */
export const IDLE_FRAMES: Record<string, number> = {
  down: 0,
  up: 2,
  left: 4,
  right: 6
};

/**
 * Generates a 4-direction player spritesheet at runtime and registers
 * walk animations. Call once during scene create before using the sprite.
 *
 * Layout: 4 rows (down, up, left, right) x 2 columns (walk frames).
 * Each frame is TILE_SIZE x TILE_SIZE.
 */
export function generatePlayerTexture(scene: Phaser.Scene): void {
  const cols = FRAME_COUNT;
  const rows = 4;
  const size = TILE_SIZE;
  const gfx = scene.add.graphics();
  gfx.setVisible(false);

  const directions: Array<{ row: number; eyeOffsets: Array<{ ex: number; ey: number }> }> = [
    { row: 0, eyeOffsets: [{ ex: -4, ey: -4 }, { ex: 4, ey: -4 }] },   // down
    { row: 1, eyeOffsets: [] },                                          // up (no eyes visible)
    { row: 2, eyeOffsets: [{ ex: -4, ey: -4 }] },                       // left
    { row: 3, eyeOffsets: [{ ex: 4, ey: -4 }] }                         // right
  ];

  for (const dir of directions) {
    for (let frame = 0; frame < cols; frame++) {
      const cx = frame * size + size / 2;
      const cy = dir.row * size + size / 2;
      const bobY = frame === 1 ? -1 : 0;

      /* Body circle */
      gfx.fillStyle(BODY_COLOR, 1);
      gfx.fillCircle(cx, cy + 2 + bobY, 10);

      /* Head circle */
      gfx.fillCircle(cx, cy - 6 + bobY, 7);

      /* Eyes */
      gfx.fillStyle(EYE_COLOR, 1);
      for (const eye of dir.eyeOffsets) {
        gfx.fillCircle(cx + eye.ex, cy - 6 + eye.ey + bobY, 2);
      }
    }
  }

  gfx.generateTexture("player_sprite", cols * size, rows * size);
  gfx.destroy();

  /* Cut individual frames from the generated texture. */
  const tex = scene.textures.get("player_sprite");
  let frameIdx = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      tex.add(frameIdx, 0, col * size, row * size, size, size);
      frameIdx++;
    }
  }

  /* Register walk animations. */
  const dirNames: Array<keyof typeof WALK_ANIMS> = ["down", "up", "left", "right"];
  for (let d = 0; d < dirNames.length; d++) {
    const startFrame = d * cols;
    scene.anims.create({
      key: WALK_ANIMS[dirNames[d]!],
      frames: scene.anims.generateFrameNumbers("player_sprite", {
        start: startFrame,
        end: startFrame + cols - 1
      }),
      frameRate: 6,
      repeat: -1
    });
  }
}

/**
 * Returns the animation key for the given facing direction.
 */
export function animKeyForFacing(facingX: number, facingY: number): string {
  if (facingY < 0) return WALK_ANIMS.up;
  if (facingY > 0) return WALK_ANIMS.down;
  if (facingX < 0) return WALK_ANIMS.left;
  return WALK_ANIMS.right;
}

/**
 * Returns the idle frame index for the given facing direction.
 */
export function idleFrameForFacing(facingX: number, facingY: number): number {
  if (facingY < 0) return IDLE_FRAMES["up"]!;
  if (facingY > 0) return IDLE_FRAMES["down"]!;
  if (facingX < 0) return IDLE_FRAMES["left"]!;
  return IDLE_FRAMES["right"]!;
}
