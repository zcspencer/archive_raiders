import { randomUUID } from "node:crypto";
import type { ItemInstance } from "@odyssey/shared";
import { PostgresDatabase } from "../db/postgres.js";

const DEFAULT_SLOT_COUNT = 24;

interface InventoryRow {
  id: string;
  user_id: string;
  definition_id: string;
  definition_version: number;
  quantity: number;
  slot_index: number | null;
  parent_instance_id: string | null;
}

function rowToInstance(row: InventoryRow, children?: ItemInstance[]): ItemInstance {
  const out: ItemInstance = {
    instanceId: row.id,
    definitionId: row.definition_id,
    definitionVersion: row.definition_version,
    quantity: row.quantity
  };
  if (children?.length) out.containedItems = children;
  return out;
}

/**
 * Server-side inventory CRUD. All writes use DB transactions.
 */
export class InventoryService {
  constructor(
    private readonly db: PostgresDatabase,
    private readonly slotCount: number = DEFAULT_SLOT_COUNT
  ) {}

  /**
   * Returns all top-level items with nested containedItems (full tree).
   */
  async getInventory(userId: string): Promise<ItemInstance[]> {
    const rows = await this.db.query<InventoryRow>(
      `SELECT id, user_id, definition_id, definition_version, quantity, slot_index, parent_instance_id
       FROM player_inventory WHERE user_id = $1 ORDER BY parent_instance_id NULLS FIRST, slot_index NULLS LAST`,
      [userId]
    );
    const byParent = new Map<string | null, InventoryRow[]>();
    for (const row of rows) {
      const key = row.parent_instance_id ?? null;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(row);
    }
    function buildTree(parentKey: string | null): ItemInstance[] {
      const list = byParent.get(parentKey) ?? [];
      return list.map((row) => {
        const children = buildTree(row.id);
        return rowToInstance(row, children.length ? children : undefined);
      });
    }
    return buildTree(null);
  }

  /**
   * Creates new item instances and assigns slot indices. Returns created instances.
   */
  async addItems(
    userId: string,
    entries: Array<{ definitionId: string; quantity: number; definitionVersion?: number }>
  ): Promise<ItemInstance[]> {
    return this.db.transaction(async (client) => {
      const existing = await PostgresDatabase.queryClient<{ slot_index: number }>(
        client,
        `SELECT slot_index FROM player_inventory WHERE user_id = $1 AND parent_instance_id IS NULL AND slot_index IS NOT NULL`,
        [userId]
      );
      const used = new Set(existing.map((r) => r.slot_index));
      let nextSlot = 0;
      const created: ItemInstance[] = [];
      const now = new Date().toISOString();
      for (const entry of entries) {
        while (nextSlot < this.slotCount && used.has(nextSlot)) nextSlot += 1;
        if (nextSlot >= this.slotCount) break;
        const id = randomUUID();
        const version = entry.definitionVersion ?? 1;
        await client.query(
          `INSERT INTO player_inventory (id, user_id, definition_id, definition_version, quantity, slot_index, parent_instance_id, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NULL, $7, $7)`,
          [id, userId, entry.definitionId, version, Math.max(1, entry.quantity), nextSlot, now]
        );
        used.add(nextSlot);
        created.push({
          instanceId: id,
          definitionId: entry.definitionId,
          definitionVersion: version,
          quantity: Math.max(1, entry.quantity)
        });
        nextSlot += 1;
      }
      return created;
    });
  }

  /**
   * Removes an item instance (and contained items via CASCADE).
   */
  async removeItem(userId: string, instanceId: string): Promise<void> {
    const result = await this.db.query<{ id: string }>(
      `DELETE FROM player_inventory WHERE id = $1 AND user_id = $2 RETURNING id`,
      [instanceId, userId]
    );
    if (result.length === 0) throw new Error("Item not found or not owned");
  }

  /**
   * Moves an item to a slot (or swaps with existing). Validates slot in range.
   */
  async moveItem(userId: string, instanceId: string, toSlotIndex: number): Promise<void> {
    if (toSlotIndex < 0 || toSlotIndex >= this.slotCount) throw new Error("Invalid slot");
    await this.db.transaction(async (client) => {
      const existing = await PostgresDatabase.queryClient<InventoryRow>(
        client,
        `SELECT id, slot_index FROM player_inventory WHERE user_id = $1 AND (id = $2 OR (parent_instance_id IS NULL AND slot_index = $3))`,
        [userId, instanceId, toSlotIndex]
      );
      const moving = existing.find((r) => r.id === instanceId);
      const atTarget = existing.find((r) => r.id !== instanceId && r.slot_index === toSlotIndex);
      if (!moving) throw new Error("Item not found or not owned");
      const now = new Date().toISOString();
      if (atTarget) {
        await client.query(
          `UPDATE player_inventory SET slot_index = $1, updated_at = $2 WHERE id = $3`,
          [moving.slot_index, now, atTarget.id]
        );
      }
      await client.query(
        `UPDATE player_inventory SET slot_index = $1, updated_at = $2 WHERE id = $3`,
        [toSlotIndex, now, instanceId]
      );
    });
  }

  /**
   * Moves a contained item to a top-level inventory slot.
   */
  async extractItem(
    userId: string,
    parentInstanceId: string,
    childInstanceId: string
  ): Promise<void> {
    const nextSlot = await this.findNextFreeSlot(userId);
    if (nextSlot === null) throw new Error("No free slot");
    const now = new Date().toISOString();
    const result = await this.db.query<{ id: string }>(
      `UPDATE player_inventory SET parent_instance_id = NULL, slot_index = $1, updated_at = $2
       WHERE id = $3 AND user_id = $4 AND parent_instance_id = $5 RETURNING id`,
      [nextSlot, now, childInstanceId, userId, parentInstanceId]
    );
    if (result.length === 0) throw new Error("Child not found or not in container");
  }

  /**
   * Moves a top-level item into a container. Caller must validate container component.
   */
  async insertItem(
    userId: string,
    containerInstanceId: string,
    childInstanceId: string
  ): Promise<void> {
    const result = await this.db.query<{ id: string }>(
      `UPDATE player_inventory SET parent_instance_id = $1, slot_index = NULL, updated_at = $2
       WHERE id = $3 AND user_id = $4 AND parent_instance_id IS NULL RETURNING id`,
      [containerInstanceId, new Date().toISOString(), childInstanceId, userId]
    );
    if (result.length === 0) throw new Error("Item not found or already contained");
  }

  private async findNextFreeSlot(userId: string): Promise<number | null> {
    const used = await this.db.query<{ slot_index: number }>(
      `SELECT slot_index FROM player_inventory WHERE user_id = $1 AND parent_instance_id IS NULL AND slot_index IS NOT NULL`,
      [userId]
    );
    const set = new Set(used.map((r) => r.slot_index));
    for (let i = 0; i < this.slotCount; i++) if (!set.has(i)) return i;
    return null;
  }
}
