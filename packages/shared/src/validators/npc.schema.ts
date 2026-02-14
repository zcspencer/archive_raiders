import { z } from "zod";

/**
 * Runtime validator for a single dialogue line.
 */
export const dialogueLineSchema = z.object({
  speaker: z.string().min(1),
  text: z.string().min(1)
});

/**
 * Runtime validator for an NPC content definition.
 */
export const npcDefinitionSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  dialogueLines: z.array(dialogueLineSchema).min(1)
});

/**
 * Runtime validator for an interactable object definition.
 */
export const interactableObjectDefSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["chest", "door", "artifact", "sign"]),
  label: z.string().min(1)
});
