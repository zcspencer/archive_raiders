import { randomUUID } from "node:crypto";
import type { ContainerDefinition, CurrencyReward } from "@odyssey/shared";
import type { ItemInstance } from "@odyssey/shared";
import type { InventoryService } from "./InventoryService.js";
import type { CurrencyService } from "./CurrencyService.js";
import type { ContainerDefinitionLoader } from "./ContainerDefinitionLoader.js";
import type { ItemDefinitionLoader } from "./ItemDefinitionLoader.js";
import type { PostgresDatabase } from "../db/postgres.js";

interface ContainerClaimRow {
  id: string;
  user_id: string;
  object_id: string;
  nonce: string;
  state: string;
}

interface RolledLoot {
  definitionId: string;
  quantity: number;
  name: string;
}

/**
 * Server-side container open/claim with stateful persistence and idempotency.
 */
export class ContainerService {
  constructor(
    private readonly db: PostgresDatabase,
    private readonly containerLoader: ContainerDefinitionLoader,
    private readonly itemLoader: ItemDefinitionLoader,
    private readonly inventoryService: InventoryService,
    private readonly currencyService: CurrencyService
  ) {}

  /**
   * Opens a container for the player. Returns nonce and loot preview. Throws if already claimed.
   */
  async openContainer(
    userId: string,
    objectId: string
  ): Promise<{ nonce: string; items: RolledLoot[]; currencyRewards: CurrencyReward[] }> {
    const definition = this.containerLoader.getDefinition(objectId);
    if (!definition) throw new Error("Container not found");

    const existing = await this.db.query<ContainerClaimRow>(
      `SELECT id, user_id, object_id, nonce, state FROM container_claims WHERE user_id = $1 AND object_id = $2`,
      [userId, objectId]
    );

    if (existing.length > 0) {
      const row = existing[0]!;
      if (row.state === "claimed") throw new Error("Already looted");
      const items = this.rollLoot(definition);
      const names = this.resolveNames(items);
      return {
        nonce: row.nonce,
        items: items.map((item, i) => ({ ...item, name: names[i] ?? item.definitionId })),
        currencyRewards: definition.currencyRewards
      };
    }

    const nonce = randomUUID();
    const now = new Date().toISOString();
    await this.db.query(
      `INSERT INTO container_claims (id, user_id, object_id, nonce, state, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'open', $5, $5)`,
      [randomUUID(), userId, objectId, nonce, now]
    );
    const items = this.rollLoot(definition);
    const names = this.resolveNames(items);
    return {
      nonce,
      items: items.map((item, i) => ({ ...item, name: names[i] ?? item.definitionId })),
      currencyRewards: definition.currencyRewards
    };
  }

  /**
   * Claims container loot. Idempotent: if already claimed for this nonce, returns success without double-grant.
   */
  async claimContainer(
    userId: string,
    objectId: string,
    nonce: string
  ): Promise<{ grantedItems: Array<{ definitionId: string; quantity: number }>; grantedCurrency: CurrencyReward[] }> {
    const definition = this.containerLoader.getDefinition(objectId);
    if (!definition) throw new Error("Container not found");

    const rows = await this.db.query<ContainerClaimRow>(
      `SELECT id, user_id, object_id, nonce, state FROM container_claims WHERE user_id = $1 AND object_id = $2`,
      [userId, objectId]
    );
    if (rows.length === 0) throw new Error("Container not opened");
    const row = rows[0]!;
    if (row.nonce !== nonce) throw new Error("Invalid nonce");

    if (row.state === "claimed") {
      return { grantedItems: [], grantedCurrency: [] };
    }

    const items = this.rollLoot(definition);
    const inventory = await this.inventoryService.getInventory(userId);
    const toGrant = filterImportantSingleInstance(items, inventory, this.itemLoader);

    if (toGrant.length > 0) {
      await this.inventoryService.addItems(
        userId,
        toGrant.map((e) => ({ definitionId: e.definitionId, quantity: e.quantity }))
      );
    }
    for (const reward of definition.currencyRewards) {
      await this.currencyService.addCurrency(userId, reward.currencyType, reward.amount);
    }

    const now = new Date().toISOString();
    await this.db.query(
      `UPDATE container_claims SET state = 'claimed', updated_at = $1 WHERE id = $2`,
      [now, row.id]
    );

    return {
      grantedItems: toGrant,
      grantedCurrency: definition.currencyRewards
    };
  }

  /**
   * Returns whether the player has already claimed this container.
   */
  async hasPlayerClaimed(userId: string, objectId: string): Promise<boolean> {
    const rows = await this.db.query<{ state: string }>(
      `SELECT state FROM container_claims WHERE user_id = $1 AND object_id = $2`,
      [userId, objectId]
    );
    return rows.length > 0 && rows[0]!.state === "claimed";
  }

  private rollLoot(definition: ContainerDefinition): RolledLoot[] {
    return definition.loot.map((entry) => ({
      definitionId: entry.definitionId,
      quantity: entry.quantity,
      name: this.itemLoader.getDefinition(entry.definitionId)?.name ?? entry.definitionId
    }));
  }

  private resolveNames(items: Array<{ definitionId: string }>): string[] {
    return items.map((item) => this.itemLoader.getDefinition(item.definitionId)?.name ?? item.definitionId);
  }
}

function countInstancesByDefinitionId(items: ItemInstance[], definitionId: string): number {
  let n = 0;
  for (const item of items) {
    if (item.definitionId === definitionId) n += item.quantity;
    if (item.containedItems) n += countInstancesByDefinitionId(item.containedItems, definitionId);
  }
  return n;
}

function filterImportantSingleInstance(
  items: RolledLoot[],
  inventory: ItemInstance[],
  itemLoader: ItemDefinitionLoader
): Array<{ definitionId: string; quantity: number }> {
  const out: Array<{ definitionId: string; quantity: number }> = [];
  for (const { definitionId, quantity } of items) {
    const def = itemLoader.getDefinition(definitionId);
    if (def?.rarity === "Important") {
      if (countInstancesByDefinitionId(inventory, definitionId) >= 1) continue;
      out.push({ definitionId, quantity: Math.min(quantity, 1) });
    } else {
      out.push({ definitionId, quantity });
    }
  }
  return out;
}
