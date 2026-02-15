import { create } from "zustand";
import { persist } from "zustand/middleware";

const SLOT_COUNT = 9;

interface PlayerHotbarState {
  /** Slot index -> instance ID of Equippable item, or null if empty. */
  slots: (string | null)[];
  addToToolbar: (instanceId: string) => void;
  setSlot: (slotIndex: number, instanceId: string | null) => void;
  /** Clears slots that reference instanceIds not present in the given list. */
  pruneOrphans: (validInstanceIds: string[]) => void;
}

const emptySlots = (): (string | null)[] =>
  Array.from({ length: SLOT_COUNT }, (): string | null => null);

/**
 * Zustand store for hotbar slot assignments. Client-authoritative; persisted to localStorage.
 * Only Equippable items should be added; validation is done at add-time by the caller.
 */
export const usePlayerHotbarStore = create<PlayerHotbarState>()(
  persist(
    (set) => ({
      slots: emptySlots(),

      addToToolbar: (instanceId): void => {
        set((state) => {
          const idx = state.slots.findIndex((s) => s === null);
          if (idx < 0) return state;
          const next = [...state.slots];
          next[idx] = instanceId;
          return { slots: next };
        });
      },

      setSlot: (slotIndex, instanceId): void => {
        set((state) => {
          if (slotIndex < 0 || slotIndex >= SLOT_COUNT) return state;
          const next = [...state.slots];
          next[slotIndex] = instanceId;
          return { slots: next };
        });
      },

      pruneOrphans: (validInstanceIds): void => {
        const valid = new Set(validInstanceIds);
        set((state) => {
          let changed = false;
          const next = state.slots.map((id: string | null) => {
            if (id !== null && !valid.has(id)) {
              changed = true;
              return null;
            }
            return id;
          });
          return changed ? { slots: next } : state;
        });
      }
    }),
    { name: "odyssey-player-hotbar" }
  )
);
