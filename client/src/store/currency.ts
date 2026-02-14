import type { CurrencyType } from "@odyssey/shared";
import { create } from "zustand";

interface CurrencyState {
  balances: Record<CurrencyType, number>;
  setBalances: (balances: Record<CurrencyType, number>) => void;
}

/**
 * Zustand store for player currency balances. Replaced from server snapshot on CurrencyUpdate.
 */
export const useCurrencyStore = create<CurrencyState>((set) => ({
  balances: { coins: 0, museum_points: 0 },
  setBalances: (balances): void => set({ balances })
}));
