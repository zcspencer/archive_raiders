import { create } from "zustand";

type InputMode = "game" | "ui";

interface TileCursor {
  gridX: number;
  gridY: number;
}

interface PlayerControlState {
  inputMode: InputMode;
  inventoryOpen: boolean;
  selectedHotbarSlot: number;
  cursorTile: TileCursor;
  setInputMode: (mode: InputMode) => void;
  toggleInventory: () => void;
  setSelectedHotbarSlot: (slotIndex: number) => void;
  setCursorTile: (gridX: number, gridY: number) => void;
}

/**
 * Client-side control state shared between UI and Phaser.
 */
export const usePlayerControlStore = create<PlayerControlState>((set) => ({
  inputMode: "game",
  inventoryOpen: false,
  selectedHotbarSlot: 0,
  cursorTile: { gridX: 0, gridY: 0 },
  setInputMode: (inputMode): void => set({ inputMode }),
  toggleInventory: (): void =>
    set((state) => {
      const nextOpen = !state.inventoryOpen;
      return {
        inventoryOpen: nextOpen,
        inputMode: nextOpen ? "ui" : "game"
      };
    }),
  setSelectedHotbarSlot: (slotIndex): void => set({ selectedHotbarSlot: slotIndex }),
  setCursorTile: (gridX, gridY): void => set({ cursorTile: { gridX, gridY } })
}));
