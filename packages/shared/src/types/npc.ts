/**
 * A single line of dialogue spoken by a character.
 */
export interface DialogueLine {
  speaker: string;
  text: string;
}

/**
 * Static NPC definition loaded from content JSON.
 */
export interface NpcDefinition {
  id: string;
  displayName: string;
  dialogueLines: DialogueLine[];
}

/**
 * Types of interactable map objects.
 */
export type InteractableObjectKind = "chest" | "door" | "artifact" | "sign";

/**
 * Static definition for an interactable object placed on the map.
 */
export interface InteractableObjectDef {
  id: string;
  kind: InteractableObjectKind;
  label: string;
}
