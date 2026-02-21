import { z } from "zod";

/**
 * Runtime validator for item rarity.
 */
export const itemRaritySchema = z.enum([
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Legendary",
  "Important"
]);

/**
 * Runtime validator for map sprite config (spritesheet key + frame index for world objects).
 */
export const mapSpriteConfigSchema = z.object({
  sheetKey: z.string().min(1),
  frame: z.number().int().nonnegative()
});

/**
 * Runtime validator for component descriptor (params validated loosely; server registry does deep validation).
 */
export const componentDescriptorSchema = z.object({
  typeId: z.string().min(1),
  params: z.record(z.unknown())
});

/**
 * Runtime validator for item definition from content JSON.
 */
export const itemDefinitionSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().positive(),
  name: z.string().min(1),
  description: z.string(),
  maxStackSize: z.number().int().positive(),
  inventorySprite: z.string().min(1),
  equippedSprite: z.string().min(1).optional(),
  mapSprite: mapSpriteConfigSchema.optional(),
  rarity: itemRaritySchema.default("Common"),
  tags: z.array(z.string().min(1)).optional(),
  components: z.array(componentDescriptorSchema)
});
