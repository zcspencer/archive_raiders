import type { NpcDefinition, DialogueLine } from "@odyssey/shared";
import { npcDefinitionSchema } from "@odyssey/shared";

/* Static imports for known NPC dialogue files. */
import villageElderJson from "../../../../content/npcs/village_elder.json";
import blacksmithJson from "../../../../content/npcs/blacksmith.json";

const NPC_DATA: Record<string, unknown> = {
  village_elder: villageElderJson,
  blacksmith: blacksmithJson
};

const cache = new Map<string, NpcDefinition>();

/**
 * Loads and validates NPC dialogue by id.
 * Returns the parsed NPC definition or null if not found.
 */
export function getNpcDefinition(npcId: string): NpcDefinition | null {
  const cached = cache.get(npcId);
  if (cached) return cached;

  const raw = NPC_DATA[npcId];
  if (!raw) return null;

  const result = npcDefinitionSchema.safeParse(raw);
  if (!result.success) {
    console.warn(`Invalid NPC data for "${npcId}":`, result.error.issues);
    return null;
  }

  cache.set(npcId, result.data);
  return result.data;
}

/**
 * Returns dialogue lines for the given NPC, or an empty array if not found.
 */
export function getNpcDialogue(npcId: string): DialogueLine[] {
  return getNpcDefinition(npcId)?.dialogueLines ?? [];
}

/**
 * Replaces the NPC definition cache with fresh definitions (used by dev content reload).
 */
export function replaceNpcDefinitions(defs: NpcDefinition[]): void {
  cache.clear();
  for (const def of defs) {
    if (def.id) cache.set(def.id, def);
  }
}
