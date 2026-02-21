import type { EquipmentSlot } from "./equipmentSlot.js";

/**
 * Item rarity. Important = single instance per player, cannot be dropped.
 */
export const ITEM_RARITIES = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Important"] as const;

export type ItemRarity = (typeof ITEM_RARITIES)[number];

/**
 * Equippable component params. baseDamage and tagModifiers drive damage to destroyable targets.
 */
export interface EquippableParams {
  slot: EquipmentSlot;
  /** Base damage per attack; 0 = no damage (e.g. watering can). */
  baseDamage?: number;
  /** Tag -> multiplier (e.g. { "tree": 3.0 } = 300% damage vs items with tag "tree"). */
  tagModifiers?: Record<string, number>;
  /** Attacks per second. Default 1. */
  rate?: number;
  /** Range in tiles (Chebyshev distance). Default 1. */
  range?: number;
}

/**
 * Sprite configuration for rendering an item as a world object on the map.
 * References a spritesheet key (from boot.json) and frame index.
 */
export interface MapSpriteConfig {
  sheetKey: string;
  frame: number;
}

/**
 * Descriptor for a component attached to an item definition.
 * Params are validated by the server component registry.
 */
export interface ComponentDescriptor {
  typeId: string;
  params: Record<string, unknown>;
}

/**
 * Item definition loaded from content JSON.
 * Version increments when component list or params change (not display-only fields).
 */
export interface ItemDefinition {
  id: string;
  version: number;
  name: string;
  description: string;
  maxStackSize: number;
  inventorySprite: string;
  equippedSprite?: string;
  /** Sprite config for world objects on the map (trees, rocks). Uses spritesheet + frame. */
  mapSprite?: MapSpriteConfig;
  /** Defaults to Common. Important = single instance per player, cannot be dropped. */
  rarity?: ItemRarity;
  /** Freeform tags for grouping items (e.g. "gem", "food"). Used by tag-based loot sources. */
  tags?: string[];
  components: ComponentDescriptor[];
}
