import type { ToolId } from "@odyssey/shared";
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
  equippedToolId: ToolId;
  cursorTile: TileCursor;
  setInputMode: (mode: InputMode) => void;
  toggleInventory: () => void;
  setSelectedHotbarSlot: (slotIndex: number) => void;
  setCursorTile: (gridX: number, gridY: number) => void;
}

const HOTBAR_TOOL_MAP: readonly ToolId[] = ["axe", "watering_can", "seeds"];

/**
 * Client-side control state shared between UI and Phaser.
 */
export const usePlayerControlStore = create<PlayerControlState>((set) => ({
  inputMode: "game",
  inventoryOpen: false,
  selectedHotbarSlot: 0,
  equippedToolId: "axe",
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
  setSelectedHotbarSlot: (slotIndex): void =>
    set({
      selectedHotbarSlot: slotIndex,
      equippedToolId: HOTBAR_TOOL_MAP[slotIndex % HOTBAR_TOOL_MAP.length] ?? "axe"
    }),
  setCursorTile: (gridX, gridY): void => set({ cursorTile: { gridX, gridY } })
}));
