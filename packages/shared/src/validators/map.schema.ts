import { z } from "zod";

const tiledPointSchema = z.object({ x: z.number(), y: z.number() });

const tiledPropertySchema = z.object({
  name: z.string(),
  type: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()])
});

const tiledObjectSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  visible: z.boolean().optional(),
  polygon: z.array(tiledPointSchema).optional(),
  ellipse: z.boolean().optional(),
  properties: z.array(tiledPropertySchema).optional()
});

const tiledTileLayerSchema = z.object({
  name: z.string(),
  type: z.literal("tilelayer"),
  width: z.number().optional(),
  height: z.number().optional(),
  data: z.array(z.number()).optional(),
  visible: z.boolean().optional()
});

const tiledObjectLayerSchema = z.object({
  name: z.string(),
  type: z.literal("objectgroup"),
  objects: z.array(tiledObjectSchema).optional(),
  visible: z.boolean().optional()
});

const tiledLayerSchema = z.union([
  tiledTileLayerSchema,
  tiledObjectLayerSchema
]);

const tiledTilesetRefSchema = z.object({
  firstgid: z.number(),
  source: z.string()
});

/**
 * Runtime validator for Tiled JSON map format.
 */
export const tiledMapSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  tilewidth: z.number().int().positive(),
  tileheight: z.number().int().positive(),
  orientation: z.string().optional(),
  renderorder: z.string().optional(),
  tilesets: z.array(tiledTilesetRefSchema).optional(),
  layers: z.array(tiledLayerSchema)
});
