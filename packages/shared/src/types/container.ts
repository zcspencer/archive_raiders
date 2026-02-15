import type { CurrencyType } from "./currency.js";
import type { ItemRarity } from "./itemDefinition.js";
import type { LootDrop } from "./lootTable.js";

/**
 * Container kind for world interactables. Extensible by adding values.
 */
export const CONTAINER_KINDS = [
  "chest",
  "crate",
  "bag",
  "bookshelf",
  "cabinet"
] as const;

export type ContainerKind = (typeof CONTAINER_KINDS)[number];

/**
 * Single loot entry in a container definition (weight optional for random roll).
 */
export interface LootEntry {
  definitionId: string;
  quantity: number;
  weight?: number;
}

/**
 * Currency reward from a container.
 */
export interface CurrencyReward {
  currencyType: CurrencyType;
  amount: number;
}

/**
 * Container definition loaded from content JSON.
 * Uses either legacy `loot` (flat list, all granted) or new `drops` (RPG loot table system).
 * Exactly one of `loot` or `drops` must be present.
 */
export interface ContainerDefinition {
  id: string;
  kind: ContainerKind;
  /** Legacy flat loot list. Every entry is granted deterministically. */
  loot?: LootEntry[];
  /** RPG-style loot drops with configurable selection methods. */
  drops?: LootDrop[];
  currencyRewards: CurrencyReward[];
}

/**
 * Payload sent when opening a container.
 */
export interface OpenContainerPayload {
  objectId: string;
}

/**
 * Payload sent when claiming container loot. Nonce is returned by server on open.
 */
export interface ClaimContainerPayload {
  objectId: string;
  nonce: string;
}

/**
 * Item preview in container contents message (server -> client).
 */
export interface ContainerItemPreview {
  definitionId: string;
  name: string;
  quantity: number;
  /** Display rarity; defaults to Common when omitted. */
  rarity?: ItemRarity;
}

/**
 * Message sent when server responds with container contents (preview before claim).
 */
export interface ContainerContentsMessage {
  objectId: string;
  nonce: string;
  items: ContainerItemPreview[];
  currencyRewards: CurrencyReward[];
}
