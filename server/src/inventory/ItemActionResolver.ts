import type { EquipmentSlot, ItemAction, ItemInstance } from "@odyssey/shared";
import { getComponentType } from "./components/ComponentRegistry.js";
import type { ComponentContext } from "./components/ComponentRegistry.js";
import type { ItemDefinitionLoader } from "./ItemDefinitionLoader.js";
import type { InventoryService } from "./InventoryService.js";
import type { EquipmentService } from "./EquipmentService.js";

/**
 * Resolves available actions for an item and executes them. Server-authoritative.
 */
export class ItemActionResolver {
  constructor(
    private readonly itemLoader: ItemDefinitionLoader,
    private readonly inventoryService: InventoryService,
    private readonly equipmentService: EquipmentService
  ) {}

  /**
   * Returns the list of actions available for this item instance.
   */
  getActions(userId: string, instance: ItemInstance): ItemAction[] {
    const definition = this.itemLoader.getDefinition(instance.definitionId);
    if (!definition) return ["drop"];

    const actions = new Set<ItemAction>();
    if (definition.rarity !== "Important") actions.add("drop");

    for (const desc of definition.components) {
      const component = getComponentType(desc.typeId);
      if (!component?.getActions) continue;
      const ctx: ComponentContext = {
        userId,
        instanceId: instance.instanceId,
        definition,
        componentParams: desc.params
      };
      for (const a of component.getActions(ctx)) actions.add(a);
    }

    if (instance.containedItems && instance.containedItems.length > 0) {
      actions.add("open");
    }

    return Array.from(actions);
  }

  /**
   * Executes an action. Validates ownership and dispatches to component hook.
   */
  async executeAction(
    userId: string,
    instanceId: string,
    action: ItemAction
  ): Promise<{ success: boolean; reason?: string }> {
    const inventory = await this.inventoryService.getInventory(userId);
    const instance = findInstance(inventory, instanceId);
    if (!instance) return { success: false, reason: "Item not found" };

    const definition = this.itemLoader.getDefinition(instance.definitionId);
    if (!definition) return { success: false, reason: "Definition not found" };

    if (action === "drop") {
      if (definition.rarity === "Important") {
        return { success: false, reason: "Important items cannot be dropped" };
      }
      const equipment = await this.equipmentService.getEquipment(userId);
      if (equipment.hand === instanceId) await this.equipmentService.unequip(userId, "hand");
      if (equipment.head === instanceId) await this.equipmentService.unequip(userId, "head");
      await this.inventoryService.removeItem(userId, instanceId);
      return { success: true };
    }

    if (action === "equip" || action === "unequip") {
      const desc = definition.components.find(
        (c) => c.typeId === "Equippable" || c.typeId === "Cosmetic"
      );
      if (!desc) return { success: false, reason: "Not equippable" };
      const component = getComponentType(desc.typeId);
      const slot = (desc.params as { slot?: EquipmentSlot }).slot;
      if (!slot) return { success: false, reason: "No slot" };
      if (action === "equip") {
        await this.equipmentService.equip(userId, instanceId, slot);
        component?.onEquip?.({
          userId,
          instanceId,
          definition,
          componentParams: desc.params
        });
      } else {
        await this.equipmentService.unequip(userId, slot);
        component?.onUnequip?.({
          userId,
          instanceId,
          definition,
          componentParams: desc.params
        });
      }
      return { success: true };
    }

    if (action === "read") {
      return { success: true };
    }

    if (action === "use") {
      const desc = definition.components.find((c) => c.typeId === "UseEffect");
      if (desc) {
        const component = getComponentType(desc.typeId);
        component?.onUse?.({
          userId,
          instanceId,
          definition,
          componentParams: desc.params
        });
      }
      return { success: true };
    }

    if (action === "open") {
      return { success: true };
    }

    return { success: false, reason: "Unknown action" };
  }
}

function findInstance(items: ItemInstance[], instanceId: string): ItemInstance | null {
  for (const item of items) {
    if (item.instanceId === instanceId) return item;
    if (item.containedItems) {
      const found = findInstance(item.containedItems, instanceId);
      if (found) return found;
    }
  }
  return null;
}
