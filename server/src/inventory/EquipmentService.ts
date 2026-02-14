import type { EquipmentSlot } from "@odyssey/shared";
import { EQUIPMENT_SLOTS } from "@odyssey/shared";
import type { PostgresDatabase } from "../db/postgres.js";

/**
 * Server-side equipment slot management. References inventory by instance ID.
 */
export class EquipmentService {
  constructor(private readonly db: PostgresDatabase) {}

  /**
   * Equips an item in the given slot. Item must exist in inventory (component validation in Phase 3).
   */
  async equip(userId: string, instanceId: string, slot: EquipmentSlot): Promise<void> {
    if (!EQUIPMENT_SLOTS.includes(slot)) throw new Error("Invalid slot");
    const rows = await this.db.query<{ id: string }>(
      `SELECT id FROM player_inventory WHERE id = $1 AND user_id = $2`,
      [instanceId, userId]
    );
    if (rows.length === 0) throw new Error("Item not found or not owned");
    const now = new Date().toISOString();
    await this.db.query(
      `INSERT INTO player_equipment (user_id, slot, inventory_item_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $4)
       ON CONFLICT (user_id, slot) DO UPDATE SET inventory_item_id = $3, updated_at = $4`,
      [userId, slot, instanceId, now]
    );
  }

  /**
   * Unequips the item in the given slot.
   */
  async unequip(userId: string, slot: EquipmentSlot): Promise<void> {
    if (!EQUIPMENT_SLOTS.includes(slot)) throw new Error("Invalid slot");
    await this.db.query(
      `DELETE FROM player_equipment WHERE user_id = $1 AND slot = $2`,
      [userId, slot]
    );
  }

  /**
   * Returns map of slot -> instanceId (or null if empty).
   */
  async getEquipment(userId: string): Promise<Record<EquipmentSlot, string | null>> {
    const rows = await this.db.query<{ slot: string; inventory_item_id: string }>(
      `SELECT slot, inventory_item_id FROM player_equipment WHERE user_id = $1`,
      [userId]
    );
    const out = { hand: null as string | null, head: null as string | null };
    for (const row of rows) {
      if (row.slot === "hand" || row.slot === "head") out[row.slot] = row.inventory_item_id;
    }
    return out;
  }
}
