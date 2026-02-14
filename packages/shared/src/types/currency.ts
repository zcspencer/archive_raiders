/**
 * Currency type identifiers. Extensible by adding values to the array.
 * Each currency is a separate numeric field on the player record, not an inventory item.
 */
export const CURRENCY_TYPES = ["coins", "museum_points"] as const;

export type CurrencyType = (typeof CURRENCY_TYPES)[number];
