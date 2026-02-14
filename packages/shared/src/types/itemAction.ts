/**
 * Item actions that can be requested by the client.
 */
export const ITEM_ACTIONS = ["drop", "equip", "unequip", "use", "read", "open"] as const;

export type ItemAction = (typeof ITEM_ACTIONS)[number];

/**
 * Payload for requesting an item action from the server.
 */
export interface ItemActionRequest {
  instanceId: string;
  action: ItemAction;
}
