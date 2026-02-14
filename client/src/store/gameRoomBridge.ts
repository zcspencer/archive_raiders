import type { InteractPayload, MovePayload } from "@odyssey/shared";
import type { Room } from "colyseus.js";
import { ClientMessage } from "@odyssey/shared";
import { create } from "zustand";

interface GameRoomBridgeState {
  room: Room | null;
  setRoom: (room: Room) => void;
  clearRoom: () => void;
  sendMove: (payload: MovePayload) => void;
  sendInteract: (payload: InteractPayload) => void;
  sendSelectHotbar: (slotIndex: number) => void;
}

/**
 * Shared bridge that allows Phaser and React to use the current Colyseus room.
 */
export const useGameRoomBridgeStore = create<GameRoomBridgeState>((set, get) => ({
  room: null,
  setRoom: (room): void => set({ room }),
  clearRoom: (): void => set({ room: null }),
  sendMove: (payload): void => {
    get().room?.send(ClientMessage.Move, payload);
  },
  sendInteract: (payload): void => {
    get().room?.send(ClientMessage.Interact, payload);
  },
  sendSelectHotbar: (slotIndex): void => {
    get().room?.send(ClientMessage.SelectHotbar, { slotIndex });
  }
}));
