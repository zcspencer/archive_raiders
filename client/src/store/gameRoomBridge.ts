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
  sendEquipItem: (instanceId: string) => void;
  sendUnequipItem: (slot: "hand" | "head") => void;
  sendOpenContainer: (objectId: string) => void;
  sendClaimContainer: (objectId: string, nonce: string) => void;
  sendDropItem: (instanceId: string) => void;
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
  },
  sendEquipItem: (instanceId): void => {
    get().room?.send(ClientMessage.EquipItem, { instanceId });
  },
  sendUnequipItem: (slot): void => {
    get().room?.send(ClientMessage.UnequipItem, { slot });
  },
  sendOpenContainer: (objectId): void => {
    get().room?.send(ClientMessage.OpenContainer, { objectId });
  },
  sendClaimContainer: (objectId, nonce): void => {
    get().room?.send(ClientMessage.ClaimContainer, { objectId, nonce });
  },
  sendDropItem: (instanceId): void => {
    get().room?.send(ClientMessage.DropItem, { instanceId });
  }
}));
