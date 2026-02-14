import type { ItemAction } from "@odyssey/shared";
import type { z } from "zod";
import type { ItemDefinition } from "@odyssey/shared";

/**
 * Context passed to component hooks and getActions.
 */
export interface ComponentContext {
  userId: string;
  instanceId: string;
  definition: ItemDefinition;
  componentParams: Record<string, unknown>;
}

/**
 * Lifecycle hook for a component. Optional; only implement needed hooks.
 */
export interface ComponentHooks {
  onAdd?: (ctx: ComponentContext) => void | Promise<void>;
  onRemove?: (ctx: ComponentContext) => void | Promise<void>;
  onUse?: (ctx: ComponentContext) => void | Promise<void>;
  onEquip?: (ctx: ComponentContext) => void | Promise<void>;
  onUnequip?: (ctx: ComponentContext) => void | Promise<void>;
}

/**
 * Registered component type: schema plus optional hooks and action provider.
 */
export interface ComponentType extends ComponentHooks {
  typeId: string;
  paramsSchema: z.ZodType;
  getActions?: (ctx: ComponentContext) => ItemAction[];
}

const registry = new Map<string, ComponentType>();

/**
 * Registers a component type. Fails if typeId is already registered.
 */
export function registerComponent(component: ComponentType): void {
  if (registry.has(component.typeId)) {
    throw new Error(`Component type already registered: ${component.typeId}`);
  }
  registry.set(component.typeId, component);
}

/**
 * Returns the component type by id, or undefined.
 */
export function getComponentType(typeId: string): ComponentType | undefined {
  return registry.get(typeId);
}

/**
 * Validates and parses params for a component descriptor. Throws if invalid.
 */
export function parseComponentParams(typeId: string, params: unknown): Record<string, unknown> {
  const component = registry.get(typeId);
  if (!component) throw new Error(`Unknown component type: ${typeId}`);
  const result = component.paramsSchema.safeParse(params);
  if (!result.success) throw new Error(`Invalid params for ${typeId}: ${result.error.message}`);
  return result.data as Record<string, unknown>;
}
