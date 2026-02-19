import type { ItemDefinition } from "@odyssey/shared";

const modules = import.meta.glob<{ default: ItemDefinition }>(
  "../../../content/items/*.item.json",
  { eager: true }
);

const cache = new Map<string, ItemDefinition>();

function loadDefinitions(): void {
  if (cache.size > 0) return;
  for (const key of Object.keys(modules)) {
    const mod = modules[key];
    const def = mod?.default;
    if (def?.id) cache.set(def.id, def);
  }
}

/**
 * Returns item definition by id for UI (name, description, sprite ref). Returns undefined if not found.
 */
export function getItemDefinition(id: string): ItemDefinition | undefined {
  loadDefinitions();
  return cache.get(id);
}

/**
 * Replaces the item definition cache with fresh definitions (used by dev content reload).
 */
export function replaceItemDefinitions(defs: ItemDefinition[]): void {
  cache.clear();
  for (const def of defs) {
    if (def.id) cache.set(def.id, def);
  }
}

/** Readable component params (contentType + content). */
export interface ReadableParams {
  contentType: "text" | "image" | "render";
  content: string;
  /** Optional task ID that gates reading behind a challenge. */
  taskId?: string;
}

/**
 * Returns true if the item definition has the Equippable component (hand/head slot).
 */
export function hasEquippableComponent(def: ItemDefinition): boolean {
  const comp = def.components?.find((c) => c.typeId === "Equippable" || c.typeId === "Cosmetic");
  const slot = (comp?.params as { slot?: string } | undefined)?.slot;
  return slot === "hand" || slot === "head";
}

/**
 * Returns Readable component params if the definition has a Readable component; otherwise undefined.
 */
export function getReadableParams(def: ItemDefinition): ReadableParams | undefined {
  const comp = def.components?.find((c) => c.typeId === "Readable");
  if (!comp?.params || typeof comp.params.content !== "string") return undefined;
  const contentType = comp.params.contentType;
  if (contentType !== "text" && contentType !== "image" && contentType !== "render") {
    return undefined;
  }
  const taskId = typeof comp.params.taskId === "string" ? comp.params.taskId : undefined;
  return { contentType, content: comp.params.content, taskId };
}
