import type { ItemInstance } from "@odyssey/shared";
import type { ItemDefinitionLoader } from "../../inventory/ItemDefinitionLoader.js";

/**
 * Searches a nested item tree for the definitionId of a given instance.
 */
export function findDefinitionIdInTree(items: ItemInstance[], instanceId: string): string | undefined {
  for (const item of items) {
    if (item.instanceId === instanceId) return item.definitionId;
    if (item.containedItems) {
      const found = findDefinitionIdInTree(item.containedItems, instanceId);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * Searches a nested item tree for a specific instance by instanceId.
 */
export function findInstanceInTree(items: ItemInstance[], instanceId: string): ItemInstance | undefined {
  for (const item of items) {
    if (item.instanceId === instanceId) return item;
    if (item.containedItems) {
      const found = findInstanceInTree(item.containedItems, instanceId);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * Searches a nested item tree for the first instance matching a definitionId.
 */
export function findFirstInstanceByDefinitionId(items: ItemInstance[], definitionId: string): ItemInstance | undefined {
  for (const item of items) {
    if (item.definitionId === definitionId) return item;
    if (item.containedItems) {
      const found = findFirstInstanceByDefinitionId(item.containedItems, definitionId);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * Returns the Equippable stats (e.g. `{ chop: 1 }`) for a given item definition, if present.
 */
export function getEquippableStats(loader: ItemDefinitionLoader, definitionId: string): Record<string, number> | undefined {
  const def = loader.getDefinition(definitionId);
  if (!def) return undefined;
  const comp = def.components?.find((c) => c.typeId === "Equippable");
  const params = comp?.params as { stats?: Record<string, number> } | undefined;
  return params?.stats;
}
