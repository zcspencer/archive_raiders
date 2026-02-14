import type { CurrencyType } from "./currency.js";

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
 */
export interface ContainerDefinition {
  id: string;
  kind: ContainerKind;
  loot: LootEntry[];
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
