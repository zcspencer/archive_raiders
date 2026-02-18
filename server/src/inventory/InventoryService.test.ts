import { describe, expect, it, vi } from "vitest";
import type { PostgresDatabase } from "../db/postgres.js";
import { InventoryService } from "./InventoryService.js";

function createDbMock(): PostgresDatabase {
  return {
    query: vi.fn(),
    transaction: vi.fn()
  } as unknown as PostgresDatabase;
}

describe("InventoryService", () => {
  describe("getInventory", () => {
    it("returns empty array when no items", async () => {
      const db = createDbMock();
      vi.mocked(db.query).mockResolvedValueOnce([]);

      const service = new InventoryService(db);
      const result = await service.getInventory("user-1");

      expect(result).toEqual([]);
    });

    it("builds flat list from top-level rows", async () => {
      const db = createDbMock();
      vi.mocked(db.query).mockResolvedValueOnce([
        {
          id: "inst-1",
          user_id: "user-1",
          definition_id: "axe",
          definition_version: 1,
          quantity: 1,
          slot_index: 0,
          parent_instance_id: null
        },
        {
          id: "inst-2",
          user_id: "user-1",
          definition_id: "herb",
          definition_version: 1,
          quantity: 3,
          slot_index: 1,
          parent_instance_id: null
        }
      ]);

      const service = new InventoryService(db);
      const result = await service.getInventory("user-1");

      expect(result).toHaveLength(2);
      expect(result[0]!.instanceId).toBe("inst-1");
      expect(result[0]!.definitionId).toBe("axe");
      expect(result[1]!.quantity).toBe(3);
    });

    it("nests child items under parents", async () => {
      const db = createDbMock();
      vi.mocked(db.query).mockResolvedValueOnce([
        {
          id: "bag-1",
          user_id: "user-1",
          definition_id: "seeds-bag",
          definition_version: 1,
          quantity: 1,
          slot_index: 0,
          parent_instance_id: null
        },
        {
          id: "seed-1",
          user_id: "user-1",
          definition_id: "wheat-seeds",
          definition_version: 1,
          quantity: 5,
          slot_index: null,
          parent_instance_id: "bag-1"
        }
      ]);

      const service = new InventoryService(db);
      const result = await service.getInventory("user-1");

      expect(result).toHaveLength(1);
      expect(result[0]!.containedItems).toHaveLength(1);
      expect(result[0]!.containedItems![0]!.definitionId).toBe("wheat-seeds");
    });
  });

  describe("removeItem", () => {
    it("succeeds when item exists", async () => {
      const db = createDbMock();
      vi.mocked(db.query).mockResolvedValueOnce([{ id: "inst-1" }]);

      const service = new InventoryService(db);
      await expect(service.removeItem("user-1", "inst-1")).resolves.not.toThrow();
    });

    it("throws when item not found", async () => {
      const db = createDbMock();
      vi.mocked(db.query).mockResolvedValueOnce([]);

      const service = new InventoryService(db);
      await expect(service.removeItem("user-1", "missing")).rejects.toThrow(
        "Item not found or not owned"
      );
    });
  });

  describe("moveItem", () => {
    it("rejects invalid slot index", async () => {
      const db = createDbMock();
      const service = new InventoryService(db, 24);

      await expect(service.moveItem("user-1", "inst-1", -1)).rejects.toThrow("Invalid slot");
      await expect(service.moveItem("user-1", "inst-1", 24)).rejects.toThrow("Invalid slot");
    });
  });
});
