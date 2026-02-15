import { z } from "zod";

/**
 * Runtime validator for currency type identifiers.
 */
export const currencyTypeSchema = z.enum(["coins", "museum_points"]);

/**
 * Runtime validator for a currency reward entry.
 */
export const currencyRewardSchema = z.object({
  currencyType: currencyTypeSchema,
  amount: z.number().int().nonnegative()
});

/**
 * Runtime validator for full player currency balances.
 */
export const currencyBalancesSchema = z.object({
  coins: z.number().int().nonnegative(),
  museum_points: z.number().int().nonnegative()
});
