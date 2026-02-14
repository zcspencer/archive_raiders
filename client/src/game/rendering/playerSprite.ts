import Phaser from "phaser";
import { TILE_SIZE } from "@odyssey/shared";

const EYE_COLOR = 0x1e293b;
const FRAME_COUNT = 2;

/** Direction layout for the spritesheet. */
const DIRECTIONS: Array<{ row: number; eyeOffsets: Array<{ ex: number; ey: number }> }> = [
  { row: 0, eyeOffsets: [{ ex: -4, ey: -4 }, { ex: 4, ey: -4 }] },   // down
  { row: 1, eyeOffsets: [] },                                          // up (no eyes visible)
  { row: 2, eyeOffsets: [{ ex: -4, ey: -4 }] },                       // left
  { row: 3, eyeOffsets: [{ ex: 4, ey: -4 }] }                         // right
];

/**
 * Animation key prefix per direction.
 */
export const WALK_ANIMS = {
  down: "walk_down",
  up: "walk_up",
  left: "walk_left",
  right: "walk_right"
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
 * Generates a 4-direction spritesheet for a character and registers walk
 * animations. The texture key and anim keys are prefixed so multiple
 * variants (local player, remote player) can coexist.
 *
 * @param scene     - The active Phaser scene.
 * @param key       - Texture key (e.g. "player_sprite", "remote_sprite").
 * @param bodyColor - Fill color for the character body.
 */
export function generateCharacterTexture(
  scene: Phaser.Scene,
  key: string,
  bodyColor: number
): void {
  const cols = FRAME_COUNT;
  const rows = 4;
  const size = TILE_SIZE;
  const gfx = scene.add.graphics();
  gfx.setVisible(false);

  for (const dir of DIRECTIONS) {
    for (let frame = 0; frame < cols; frame++) {
      const cx = frame * size + size / 2;
      const cy = dir.row * size + size / 2;
      const bobY = frame === 1 ? -1 : 0;

      /* Body circle */
      gfx.fillStyle(bodyColor, 1);
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

  gfx.generateTexture(key, cols * size, rows * size);
  gfx.destroy();

  /* Cut individual frames from the generated texture. */
  const tex = scene.textures.get(key);
  let frameIdx = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      tex.add(frameIdx, 0, col * size, row * size, size, size);
      frameIdx++;
    }
  }

  /* Register walk animations with key-prefixed names. */
  const dirNames: Array<keyof typeof WALK_ANIMS> = ["down", "up", "left", "right"];
  for (let d = 0; d < dirNames.length; d++) {
    const startFrame = d * cols;
    scene.anims.create({
      key: `${key}_${WALK_ANIMS[dirNames[d]!]}`,
      frames: scene.anims.generateFrameNumbers(key, {
        start: startFrame,
        end: startFrame + cols - 1
      }),
      frameRate: 6,
      repeat: -1
    });
  }
}

/** Local player green color. */
export const PLAYER_COLOR = 0xa3e635;

/** Remote player blue color. */
export const REMOTE_COLOR = 0x60a5fa;

/**
 * Convenience: generates both local and remote player textures.
 */
export function generatePlayerTexture(scene: Phaser.Scene): void {
  generateCharacterTexture(scene, "player_sprite", PLAYER_COLOR);
  generateCharacterTexture(scene, "remote_sprite", REMOTE_COLOR);
}

/**
 * Returns the animation key for the given texture key and facing direction.
 */
export function animKeyForFacing(textureKey: string, facingX: number, facingY: number): string {
  if (facingY < 0) return `${textureKey}_${WALK_ANIMS.up}`;
  if (facingY > 0) return `${textureKey}_${WALK_ANIMS.down}`;
  if (facingX < 0) return `${textureKey}_${WALK_ANIMS.left}`;
  return `${textureKey}_${WALK_ANIMS.right}`;
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
