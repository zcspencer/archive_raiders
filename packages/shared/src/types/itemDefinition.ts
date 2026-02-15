/**
 * Item rarity. Important = single instance per player, cannot be dropped.
 */
export const ITEM_RARITIES = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Important"] as const;

export type ItemRarity = (typeof ITEM_RARITIES)[number];

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
  /** Defaults to Common. Important = single instance per player, cannot be dropped. */
  rarity?: ItemRarity;
  /** Freeform tags for grouping items (e.g. "gem", "food"). Used by tag-based loot sources. */
  tags?: string[];
  components: ComponentDescriptor[];
}
