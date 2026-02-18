import { describe, expect, it, vi } from "vitest";
import type { PostgresDatabase } from "../db/postgres.js";
import { CurrencyService } from "./CurrencyService.js";

function createDbMock(): PostgresDatabase {
  return { query: vi.fn() } as unknown as PostgresDatabase;
}

describe("CurrencyService", () => {
  it("returns zero balances when no row exists", async () => {
    const db = createDbMock();
    vi.mocked(db.query).mockResolvedValueOnce([]);

    const service = new CurrencyService(db);
    const balances = await service.getBalances("user-1");

    expect(balances).toEqual({ coins: 0, museum_points: 0 });
  });

  it("returns stored balances", async () => {
    const db = createDbMock();
    vi.mocked(db.query).mockResolvedValueOnce([{ coins: 50, museum_points: 10 }]);

    const service = new CurrencyService(db);
    const balances = await service.getBalances("user-1");

    expect(balances).toEqual({ coins: 50, museum_points: 10 });
  });

  it("addCurrency issues upsert query", async () => {
    const db = createDbMock();
    const queryMock = vi.mocked(db.query);
    queryMock.mockResolvedValueOnce([]);

    const service = new CurrencyService(db);
    await service.addCurrency("user-1", "coins", 25);

    expect(queryMock).toHaveBeenCalledTimes(1);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("coins"),
      expect.arrayContaining(["user-1", 25])
    );
  });

  it("addCurrency rejects non-positive amounts", async () => {
    const db = createDbMock();
    const service = new CurrencyService(db);

    await expect(service.addCurrency("user-1", "coins", 0)).rejects.toThrow("Amount must be positive");
    await expect(service.addCurrency("user-1", "coins", -5)).rejects.toThrow("Amount must be positive");
  });

  it("spendCurrency deducts when balance sufficient", async () => {
    const db = createDbMock();
    const queryMock = vi.mocked(db.query);
    queryMock.mockResolvedValueOnce([{ coins: 100, museum_points: 0 }]);
    queryMock.mockResolvedValueOnce([]);

    const service = new CurrencyService(db);
    await service.spendCurrency("user-1", "coins", 30);

    expect(queryMock).toHaveBeenCalledTimes(2);
    expect(queryMock.mock.calls[1]![0]).toContain("coins");
  });

  it("spendCurrency rejects when insufficient balance", async () => {
    const db = createDbMock();
    vi.mocked(db.query).mockResolvedValueOnce([{ coins: 5, museum_points: 0 }]);

    const service = new CurrencyService(db);
    await expect(service.spendCurrency("user-1", "coins", 10)).rejects.toThrow("Insufficient balance");
  });

  it("spendCurrency rejects non-positive amounts", async () => {
    const db = createDbMock();
    const service = new CurrencyService(db);

    await expect(service.spendCurrency("user-1", "coins", 0)).rejects.toThrow("Amount must be positive");
  });
});
