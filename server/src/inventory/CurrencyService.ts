import type { CurrencyType } from "@odyssey/shared";
import type { PostgresDatabase } from "../db/postgres.js";

const COLUMNS: Record<CurrencyType, string> = {
  coins: "coins",
  museum_points: "museum_points"
};

/**
 * Server-side currency balances. Validates amounts and uses atomic updates.
 */
export class CurrencyService {
  constructor(private readonly db: PostgresDatabase) {}

  /**
   * Returns current balances for all currency types.
   */
  async getBalances(userId: string): Promise<Record<CurrencyType, number>> {
    const rows = await this.db.query<{ coins: number; museum_points: number }>(
      `SELECT coins, museum_points FROM player_currency WHERE user_id = $1`,
      [userId]
    );
    if (rows.length === 0) {
      return { coins: 0, museum_points: 0 };
    }
    const r = rows[0]!;
    return { coins: r.coins, museum_points: r.museum_points };
  }

  /**
   * Adds currency. Validates amount > 0.
   */
  async addCurrency(userId: string, currencyType: CurrencyType, amount: number): Promise<void> {
    if (amount <= 0) throw new Error("Amount must be positive");
    const col = COLUMNS[currencyType];
    const now = new Date().toISOString();
    await this.db.query(
      `INSERT INTO player_currency (user_id, ${col}, created_at, updated_at)
       VALUES ($1, $2, $3, $3)
       ON CONFLICT (user_id) DO UPDATE SET ${col} = player_currency.${col} + $2, updated_at = $3`,
      [userId, amount, now]
    );
  }

  /**
   * Spends currency. Fails if insufficient balance (CHECK constraint as safety).
   */
  async spendCurrency(userId: string, currencyType: CurrencyType, amount: number): Promise<void> {
    if (amount <= 0) throw new Error("Amount must be positive");
    const balances = await this.getBalances(userId);
    if (balances[currencyType] < amount) throw new Error("Insufficient balance");
    const col = COLUMNS[currencyType];
    const now = new Date().toISOString();
    await this.db.query(
      `UPDATE player_currency SET ${col} = ${col} - $1, updated_at = $2 WHERE user_id = $3`,
      [amount, now, userId]
    );
  }
}
