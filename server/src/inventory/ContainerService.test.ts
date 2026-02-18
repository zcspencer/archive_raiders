import { describe, expect, it, vi } from "vitest";
import type { PostgresDatabase } from "../db/postgres.js";
import type { ContainerDefinitionLoader } from "./ContainerDefinitionLoader.js";
import type { CurrencyService } from "./CurrencyService.js";
import type { InventoryService } from "./InventoryService.js";
import type { ItemDefinitionLoader } from "./ItemDefinitionLoader.js";
import type { LootResolver } from "./LootResolver.js";
import { ContainerService } from "./ContainerService.js";

function createDbMock(): PostgresDatabase {
  return { query: vi.fn() } as unknown as PostgresDatabase;
}

function createContainerLoader(definitions: Record<string, unknown> = {}): ContainerDefinitionLoader {
  return {
    getDefinition: vi.fn((id: string) => definitions[id] ?? undefined)
  } as unknown as ContainerDefinitionLoader;
}

function createItemLoader(definitions: Record<string, { name: string; rarity?: string }> = {}): ItemDefinitionLoader {
  return {
    getDefinition: vi.fn((id: string) => definitions[id] ?? undefined)
  } as unknown as ItemDefinitionLoader;
}

function createInventoryService(): InventoryService {
  return {
    getInventory: vi.fn().mockResolvedValue([]),
    addItems: vi.fn().mockResolvedValue([])
  } as unknown as InventoryService;
}

function createCurrencyService(): CurrencyService {
  return {
    addCurrency: vi.fn().mockResolvedValue(undefined)
  } as unknown as CurrencyService;
}

function createLootResolver(): LootResolver {
  return {
    resolve: vi.fn().mockReturnValue([])
  } as unknown as LootResolver;
}

const CHEST_DEF = {
  id: "village_chest",
  kind: "chest",
  loot: [{ definitionId: "scroll", quantity: 1 }],
  currencyRewards: [{ currencyType: "coins", amount: 5 }]
};

describe("ContainerService", () => {
  describe("openContainer", () => {
    it("creates a claim row and returns loot preview on first open", async () => {
      const db = createDbMock();
      const queryMock = vi.mocked(db.query);
      queryMock.mockResolvedValueOnce([]);
      queryMock.mockResolvedValueOnce([]);
      const containerLoader = createContainerLoader({ village_chest: CHEST_DEF });
      const itemLoader = createItemLoader({ scroll: { name: "Scroll" } });

      const service = new ContainerService(db, containerLoader, itemLoader, createInventoryService(), createCurrencyService(), createLootResolver());
      const result = await service.openContainer("user-1", "village_chest");

      expect(result.nonce).toBeDefined();
      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.definitionId).toBe("scroll");
      expect(result.currencyRewards).toEqual(CHEST_DEF.currencyRewards);
    });

    it("returns existing nonce when already opened but not claimed", async () => {
      const db = createDbMock();
      vi.mocked(db.query).mockResolvedValueOnce([
        { id: "claim-1", user_id: "user-1", object_id: "village_chest", nonce: "existing-nonce", state: "open" }
      ]);
      const containerLoader = createContainerLoader({ village_chest: CHEST_DEF });
      const itemLoader = createItemLoader({ scroll: { name: "Scroll" } });

      const service = new ContainerService(db, containerLoader, itemLoader, createInventoryService(), createCurrencyService(), createLootResolver());
      const result = await service.openContainer("user-1", "village_chest");

      expect(result.nonce).toBe("existing-nonce");
    });

    it("throws when container already claimed", async () => {
      const db = createDbMock();
      vi.mocked(db.query).mockResolvedValueOnce([
        { id: "claim-1", user_id: "user-1", object_id: "village_chest", nonce: "nonce-1", state: "claimed" }
      ]);
      const containerLoader = createContainerLoader({ village_chest: CHEST_DEF });
      const itemLoader = createItemLoader();

      const service = new ContainerService(db, containerLoader, itemLoader, createInventoryService(), createCurrencyService(), createLootResolver());

      await expect(service.openContainer("user-1", "village_chest")).rejects.toThrow("The container is empty");
    });

    it("throws when container definition not found", async () => {
      const db = createDbMock();
      const containerLoader = createContainerLoader();
      const itemLoader = createItemLoader();

      const service = new ContainerService(db, containerLoader, itemLoader, createInventoryService(), createCurrencyService(), createLootResolver());

      await expect(service.openContainer("user-1", "unknown")).rejects.toThrow("Container not found");
    });
  });

  describe("claimContainer", () => {
    it("grants items and currency, marks as claimed", async () => {
      const db = createDbMock();
      const queryMock = vi.mocked(db.query);
      queryMock.mockResolvedValueOnce([
        { id: "claim-1", user_id: "user-1", object_id: "village_chest", nonce: "nonce-1", state: "open" }
      ]);
      queryMock.mockResolvedValueOnce([]);

      const containerLoader = createContainerLoader({ village_chest: CHEST_DEF });
      const itemLoader = createItemLoader({ scroll: { name: "Scroll" } });
      const inventoryService = createInventoryService();
      const currencyService = createCurrencyService();

      const service = new ContainerService(db, containerLoader, itemLoader, inventoryService, currencyService, createLootResolver());
      const result = await service.claimContainer("user-1", "village_chest", "nonce-1");

      expect(result.grantedItems).toHaveLength(1);
      expect(result.grantedItems[0]!.definitionId).toBe("scroll");
      expect(vi.mocked(inventoryService.addItems)).toHaveBeenCalled();
      expect(vi.mocked(currencyService.addCurrency)).toHaveBeenCalledWith("user-1", "coins", 5);
    });

    it("returns empty grants when already claimed (idempotent)", async () => {
      const db = createDbMock();
      vi.mocked(db.query).mockResolvedValueOnce([
        { id: "claim-1", user_id: "user-1", object_id: "village_chest", nonce: "nonce-1", state: "claimed" }
      ]);
      const containerLoader = createContainerLoader({ village_chest: CHEST_DEF });
      const itemLoader = createItemLoader();

      const service = new ContainerService(db, containerLoader, itemLoader, createInventoryService(), createCurrencyService(), createLootResolver());
      const result = await service.claimContainer("user-1", "village_chest", "nonce-1");

      expect(result.grantedItems).toEqual([]);
      expect(result.grantedCurrency).toEqual([]);
    });

    it("rejects invalid nonce", async () => {
      const db = createDbMock();
      vi.mocked(db.query).mockResolvedValueOnce([
        { id: "claim-1", user_id: "user-1", object_id: "village_chest", nonce: "nonce-1", state: "open" }
      ]);
      const containerLoader = createContainerLoader({ village_chest: CHEST_DEF });
      const itemLoader = createItemLoader();

      const service = new ContainerService(db, containerLoader, itemLoader, createInventoryService(), createCurrencyService(), createLootResolver());

      await expect(service.claimContainer("user-1", "village_chest", "wrong-nonce")).rejects.toThrow("Invalid nonce");
    });

    it("rejects claim when container was never opened", async () => {
      const db = createDbMock();
      vi.mocked(db.query).mockResolvedValueOnce([]);
      const containerLoader = createContainerLoader({ village_chest: CHEST_DEF });
      const itemLoader = createItemLoader();

      const service = new ContainerService(db, containerLoader, itemLoader, createInventoryService(), createCurrencyService(), createLootResolver());

      await expect(service.claimContainer("user-1", "village_chest", "any")).rejects.toThrow("Container not opened");
    });
  });

  describe("hasPlayerClaimed", () => {
    it("returns true when claimed", async () => {
      const db = createDbMock();
      vi.mocked(db.query).mockResolvedValueOnce([{ state: "claimed" }]);

      const containerLoader = createContainerLoader();
      const itemLoader = createItemLoader();
      const service = new ContainerService(db, containerLoader, itemLoader, createInventoryService(), createCurrencyService(), createLootResolver());

      await expect(service.hasPlayerClaimed("user-1", "village_chest")).resolves.toBe(true);
    });

    it("returns false when never opened", async () => {
      const db = createDbMock();
      vi.mocked(db.query).mockResolvedValueOnce([]);

      const containerLoader = createContainerLoader();
      const itemLoader = createItemLoader();
      const service = new ContainerService(db, containerLoader, itemLoader, createInventoryService(), createCurrencyService(), createLootResolver());

      await expect(service.hasPlayerClaimed("user-1", "village_chest")).resolves.toBe(false);
    });
  });
});
