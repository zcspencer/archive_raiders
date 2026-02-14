import type { InventoryStack } from "@odyssey/shared";
import { create } from "zustand";

interface PlayerInventoryState {
  /** Items the player currently holds. */
  items: InventoryStack[];

  /** Adds items to the player inventory, merging quantities for existing itemIds. */
  addItems: (incoming: InventoryStack[]) => void;

  /** Removes items from the player inventory by itemId and quantity. */
  removeItems: (outgoing: InventoryStack[]) => void;
}

/**
 * Zustand store for the player's item inventory.
 */
export const usePlayerInventoryStore = create<PlayerInventoryState>((set, get) => ({
  items: [],

  addItems: (incoming): void => {
    const current = [...get().items];
    for (const stack of incoming) {
      const existing = current.find((s) => s.itemId === stack.itemId);
      if (existing) {
        existing.quantity += stack.quantity;
      } else {
        current.push({ itemId: stack.itemId, quantity: stack.quantity });
      }
    }
    set({ items: current });
  },

  removeItems: (outgoing): void => {
    const current = [...get().items];
    for (const stack of outgoing) {
      const existing = current.find((s) => s.itemId === stack.itemId);
      if (existing) {
        existing.quantity = Math.max(0, existing.quantity - stack.quantity);
      }
    }
    set({ items: current.filter((s) => s.quantity > 0) });
  }
}));
