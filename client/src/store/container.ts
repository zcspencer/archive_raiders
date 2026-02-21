import type { CurrencyReward, ItemRarity } from "@odyssey/shared";
import { create } from "zustand";

export interface ContainerItemPreview {
  definitionId: string;
  name: string;
  quantity: number;
  rarity?: ItemRarity;
}

/** "container" requires claim; "loot_drop" is already granted (informational preview). */
export type LootPanelMode = "container" | "loot_drop";

interface ContainerState {
  mode: LootPanelMode | null;
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
  /** Show a loot drop preview (items already granted to player). */
  setLootDropPreview: (items: ContainerItemPreview[]) => void;
  closeContainer: () => void;
}

/**
 * Zustand store for loot preview panels (containers and destroy-drop loot).
 * Server is source of truth.
 */
export const useContainerStore = create<ContainerState>((set) => ({
  mode: null,
  currentContainerId: null,
  nonce: null,
  previewItems: [],
  previewCurrency: [],

  setContents: (payload): void =>
    set({
      mode: "container",
      currentContainerId: payload.objectId,
      nonce: payload.nonce,
      previewItems: payload.items,
      previewCurrency: payload.currencyRewards
    }),

  setOpening: (objectId: string): void =>
    set({
      mode: "container",
      currentContainerId: objectId,
      nonce: null,
      previewItems: [],
      previewCurrency: []
    }),

  setLootDropPreview: (items): void =>
    set({
      mode: "loot_drop",
      currentContainerId: "loot-drop",
      nonce: "loot-drop",
      previewItems: items,
      previewCurrency: []
    }),

  closeContainer: (): void =>
    set({
      mode: null,
      currentContainerId: null,
      nonce: null,
      previewItems: [],
      previewCurrency: []
    })
}));
