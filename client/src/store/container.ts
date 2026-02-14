import type { CurrencyReward } from "@odyssey/shared";
import { create } from "zustand";

export interface ContainerItemPreview {
  definitionId: string;
  name: string;
  quantity: number;
}

interface ContainerState {
  currentContainerId: string | null;
  nonce: string | null;
  previewItems: ContainerItemPreview[];
  previewCurrency: CurrencyReward[];

  setContents: (payload: {
    objectId: string;
    nonce: string;
    items: ContainerItemPreview[];
    currencyRewards: CurrencyReward[];
  }) => void;
  setOpening: (objectId: string) => void;
  closeContainer: () => void;
}

/**
 * Zustand store for open container state (preview from server). Server is source of truth.
 */
export const useContainerStore = create<ContainerState>((set) => ({
  currentContainerId: null,
  nonce: null,
  previewItems: [],
  previewCurrency: [],

  setContents: (payload): void =>
    set({
      currentContainerId: payload.objectId,
      nonce: payload.nonce,
      previewItems: payload.items,
      previewCurrency: payload.currencyRewards
    }),

  /** Call when sending OpenContainer so the panel can show loading until ContainerContents arrives. */
  setOpening: (objectId: string): void =>
    set({
      currentContainerId: objectId,
      nonce: null,
      previewItems: [],
      previewCurrency: []
    }),

  closeContainer: (): void =>
    set({
      currentContainerId: null,
      nonce: null,
      previewItems: [],
      previewCurrency: []
    })
}));
