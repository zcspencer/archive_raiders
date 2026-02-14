import type { InventoryStack, ItemInstance } from "@odyssey/shared";
import { create } from "zustand";

interface PlayerInventoryState {
  /** Items the player holds (server snapshot). */
  items: ItemInstance[];

  /** Replaces inventory with server snapshot (on InventoryUpdate message). */
  setItems: (items: ItemInstance[]) => void;

  /** Adds items locally (legacy; prefer setItems from server). */
  addItems: (incoming: InventoryStack[]) => void;

  /** Removes items by itemId and quantity (legacy). */
  removeItems: (outgoing: InventoryStack[]) => void;
}

/**
 * Zustand store for the player's item inventory. Server is source of truth; setItems replaces state.
 */
export const usePlayerInventoryStore = create<PlayerInventoryState>((set, get) => ({
  items: [],

  setItems: (items): void => set({ items }),

  addItems: (incoming): void => {
    const current = [...get().items];
    for (const stack of incoming) {
      const existing = current.find((s) => s.definitionId === stack.itemId);
      if (existing) {
        existing.quantity += stack.quantity;
      } else {
        current.push({
          instanceId: crypto.randomUUID(),
          definitionId: stack.itemId,
          definitionVersion: 1,
          quantity: stack.quantity
        });
      }
    }
    set({ items: current });
  },

  removeItems: (outgoing): void => {
    const current = [...get().items];
    for (const stack of outgoing) {
      const existing = current.find((s) => s.definitionId === stack.itemId);
      if (existing) {
        existing.quantity = Math.max(0, existing.quantity - stack.quantity);
      }
    }
    set({ items: current.filter((s) => s.quantity > 0) });
  }
}));
