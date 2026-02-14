import type { EquipmentSlot } from "../types/equipmentSlot.js";

/** Cardinal facing for anchor lookup (matches client Direction / sprite rows). */
export const FACING_DIRECTIONS = ["down", "up", "left", "right"] as const;

export type FacingDirection = (typeof FACING_DIRECTIONS)[number];

export interface AnchorConfig {
  offset: { x: number; y: number };
  zOrder: number;
  flipX: boolean;
}

/**
 * Per-slot, per-direction anchor config for rendering equipped item sprites
 * as children of the player (offset, depth, flip).
 */
export const EQUIPMENT_ANCHORS: Record<
  EquipmentSlot,
  Record<FacingDirection, AnchorConfig>
> = {
  hand: {
    down: { offset: { x: 8, y: 4 }, zOrder: 1, flipX: false },
    up: { offset: { x: -8, y: -4 }, zOrder: -1, flipX: false },
    left: { offset: { x: -10, y: 2 }, zOrder: 1, flipX: false },
    right: { offset: { x: 10, y: 2 }, zOrder: 1, flipX: true }
  },
  head: {
    down: { offset: { x: 0, y: -12 }, zOrder: 1, flipX: false },
    up: { offset: { x: 0, y: -12 }, zOrder: -1, flipX: false },
    left: { offset: { x: -2, y: -12 }, zOrder: 1, flipX: false },
    right: { offset: { x: 2, y: -12 }, zOrder: 1, flipX: true }
  }
};
