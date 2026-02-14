import { z } from "zod";

/**
 * Schema for item rewards in task content definitions.
 */
export const taskRewardItemSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().positive()
});

/**
 * Schema for a task definition loaded from content.
 */
export const taskDefinitionSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  difficulty: z.number().int().min(1).max(5),
  config: z.record(z.unknown()),
  hints: z.array(z.string()),
  rewards: z.object({
    currency: z.number().int().nonnegative(),
    xp: z.number().int().nonnegative(),
    items: z.array(taskRewardItemSchema)
  })
});
