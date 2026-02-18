import { describe, expect, it, vi } from "vitest";
import type { PostgresDatabase } from "../db/postgres.js";
import { EquipmentService } from "./EquipmentService.js";

function createDbMock(): PostgresDatabase {
  return { query: vi.fn() } as unknown as PostgresDatabase;
}

describe("EquipmentService", () => {
  it("equip validates slot then upserts", async () => {
    const db = createDbMock();
    const queryMock = vi.mocked(db.query);
    queryMock.mockResolvedValueOnce([{ id: "item-1" }]);
    queryMock.mockResolvedValueOnce([]);

    const service = new EquipmentService(db);
    await service.equip("user-1", "item-1", "hand");

    expect(queryMock).toHaveBeenCalledTimes(2);
    expect(queryMock.mock.calls[1]![1]).toEqual(
      expect.arrayContaining(["user-1", "hand", "item-1"])
    );
  });

  it("equip rejects invalid slot", async () => {
    const db = createDbMock();
    const service = new EquipmentService(db);

    await expect(
      service.equip("user-1", "item-1", "feet" as "hand")
    ).rejects.toThrow("Invalid slot");
  });

  it("equip rejects when item not in inventory", async () => {
    const db = createDbMock();
    vi.mocked(db.query).mockResolvedValueOnce([]);

    const service = new EquipmentService(db);
    await expect(service.equip("user-1", "item-1", "hand")).rejects.toThrow(
      "Item not found or not owned"
    );
  });

  it("unequip deletes equipment row", async () => {
    const db = createDbMock();
    const queryMock = vi.mocked(db.query);
    queryMock.mockResolvedValueOnce([]);

    const service = new EquipmentService(db);
    await service.unequip("user-1", "hand");

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("DELETE"),
      ["user-1", "hand"]
    );
  });

  it("unequip rejects invalid slot", async () => {
    const db = createDbMock();
    const service = new EquipmentService(db);

    await expect(service.unequip("user-1", "feet" as "hand")).rejects.toThrow(
      "Invalid slot"
    );
  });

  it("getEquipment returns slot map", async () => {
    const db = createDbMock();
    vi.mocked(db.query).mockResolvedValueOnce([
      { slot: "hand", inventory_item_id: "axe-1" }
    ]);

    const service = new EquipmentService(db);
    const equipment = await service.getEquipment("user-1");

    expect(equipment).toEqual({ hand: "axe-1", head: null });
  });

  it("getEquipment returns nulls when nothing equipped", async () => {
    const db = createDbMock();
    vi.mocked(db.query).mockResolvedValueOnce([]);

    const service = new EquipmentService(db);
    const equipment = await service.getEquipment("user-1");

    expect(equipment).toEqual({ hand: null, head: null });
  });
});
