import type { ItemInstance, LootDrop } from "@odyssey/shared";
import type { ItemDefinitionLoader } from "../../inventory/ItemDefinitionLoader.js";

/**
 * Returns the Destroyable component health for a given item definition, if present.
 */
export function getDestroyableHealth(loader: ItemDefinitionLoader, definitionId: string): number | undefined {
  const def = loader.getDefinition(definitionId);
  if (!def) return undefined;
  const comp = def.components?.find((c) => c.typeId === "Destroyable");
  const params = comp?.params as { health?: number } | undefined;
  return params?.health;
}

/**
 * Returns the Destroyable component drops for a given item definition, if present.
 */
export function getDestroyableDrops(loader: ItemDefinitionLoader, definitionId: string): LootDrop[] | undefined {
  const def = loader.getDefinition(definitionId);
  if (!def) return undefined;
  const comp = def.components?.find((c) => c.typeId === "Destroyable");
  const params = comp?.params as { drops?: LootDrop[] } | undefined;
  return params?.drops;
}

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
 * Returns the Equippable params (baseDamage, tagModifiers, rate, range) for a given item definition, if present.
 */
export function getEquippableParams(
  loader: ItemDefinitionLoader,
  definitionId: string
): { baseDamage: number; tagModifiers?: Record<string, number>; rate: number; range: number } | undefined {
  const def = loader.getDefinition(definitionId);
  if (!def) return undefined;
  const comp = def.components?.find((c) => c.typeId === "Equippable");
  const params = comp?.params as
    | { baseDamage?: number; tagModifiers?: Record<string, number>; rate?: number; range?: number }
    | undefined;
  if (!params) return undefined;
  return {
    baseDamage: params.baseDamage ?? 0,
    tagModifiers: params.tagModifiers,
    rate: params.rate ?? 1,
    range: params.range ?? 1
  };
}
