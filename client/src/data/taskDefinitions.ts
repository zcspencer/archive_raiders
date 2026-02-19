import type { TaskDefinition } from "@odyssey/shared";

const modules = import.meta.glob<{ default: TaskDefinition }>(
  "../../../content/tasks/**/*.task.json",
  { eager: true }
);

const cache = new Map<string, TaskDefinition>();

function loadDefinitions(): void {
  if (cache.size > 0) return;
  for (const key of Object.keys(modules)) {
    const mod = modules[key];
    const def = mod?.default;
    if (def?.id) cache.set(def.id, def);
  }
}

/**
 * Returns a task definition by id. Returns undefined if not found.
 */
export function getTaskDefinition(id: string): TaskDefinition | undefined {
  loadDefinitions();
  return cache.get(id);
}

/**
 * Replaces the task definition cache with fresh definitions (used by dev content reload).
 */
export function replaceTaskDefinitions(defs: TaskDefinition[]): void {
  cache.clear();
  for (const def of defs) {
    if (def.id) cache.set(def.id, def);
  }
}
