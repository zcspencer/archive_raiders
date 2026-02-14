import type { InventoryStack } from "@odyssey/shared";
import { create } from "zustand";

/**
 * Initial loot table per chest objectId.
 * Used to seed chest contents on first open.
 */
const INITIAL_CHEST_CONTENTS: Record<string, InventoryStack[]> = {
  village_chest: [
    { itemId: "scroll", quantity: 1 },
    { itemId: "coin", quantity: 5 }
  ],
  elders_chest: [
    { itemId: "ancient-map", quantity: 1 },
    { itemId: "herb", quantity: 3 },
    { itemId: "coin", quantity: 10 }
  ]
};

interface ChestState {
  /** Per-chest contents keyed by objectId. */
  contents: Record<string, InventoryStack[]>;
  /** Currently open chest objectId, or null if no chest is open. */
  currentChestId: string | null;

  /** Opens a chest, seeding its contents from the loot table if needed. */
  openChest: (chestId: string) => void;
  /** Closes the currently open chest. */
  closeChest: () => void;
  /** Returns the contents of a chest by objectId. */
  getChestContents: (chestId: string) => InventoryStack[];
  /** Replaces the contents of a chest. */
  setChestContents: (chestId: string, items: InventoryStack[]) => void;
}

/**
 * Zustand store for chest contents and the chest-open modal state.
 */
export const useChestStore = create<ChestState>((set, get) => ({
  contents: {},
  currentChestId: null,

  openChest: (chestId): void => {
    const state = get();
    if (!(chestId in state.contents)) {
      const initial = INITIAL_CHEST_CONTENTS[chestId] ?? [];
      set({
        contents: {
          ...state.contents,
          [chestId]: initial.map((s) => ({ ...s }))
        },
        currentChestId: chestId
      });
    } else {
      set({ currentChestId: chestId });
    }
  },

  closeChest: (): void => set({ currentChestId: null }),

  getChestContents: (chestId): InventoryStack[] => {
    return get().contents[chestId] ?? [];
  },

  setChestContents: (chestId, items): void =>
    set((state) => ({
      contents: { ...state.contents, [chestId]: items }
    }))
}));
