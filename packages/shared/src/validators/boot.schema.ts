import { z } from "zod";

const bootSpritesheetSchema = z.object({
  key: z.string().min(1),
  path: z.string().min(1),
  frameWidth: z.number().int().positive(),
  frameHeight: z.number().int().positive()
});

const bootMapEntrySchema = z.object({
  registryKey: z.string().min(1),
  file: z.string().min(1)
});

const bootInitialSceneSchema = z.object({
  sceneKey: z.string().min(1),
  mapKey: z.string().min(1),
  spawnName: z.string().min(1)
});

const bootLoadingScreenSchema = z.object({
  backgroundColor: z.string().min(1),
  text: z.string(),
  textStyle: z.object({
    color: z.string().min(1),
    fontSize: z.string().min(1)
  })
});

/** Runtime validator for content/boot.json. */
export const bootConfigSchema = z.object({
  spritesheets: z.array(bootSpritesheetSchema).min(1),
  maps: z.array(bootMapEntrySchema).min(1),
  initialScene: bootInitialSceneSchema,
  loadingScreen: bootLoadingScreenSchema
});
