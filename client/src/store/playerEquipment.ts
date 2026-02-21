import { create } from "zustand";

interface PlayerEquipmentState {
  /** Slot id -> instance ID of equipped item, or null if empty. */
  equipment: Record<string, string | null>;
  setEquipment: (record: Record<string, string | null>) => void;
  setSlot: (slot: string, instanceId: string | null) => void;
}

/**
 * Client-side equipment state (slot -> instanceId).
 * Replaced on ServerMessage.EquipmentUpdate; do not mutate optimistically.
 */
export const usePlayerEquipmentStore = create<PlayerEquipmentState>((set) => ({
  equipment: {},

  setEquipment: (record): void => set({ equipment: { ...record } }),

  setSlot: (slot, instanceId): void =>
    set((state) => ({
      equipment: { ...state.equipment, [slot]: instanceId }
    }))
}));
