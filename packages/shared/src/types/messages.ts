export enum ClientMessage {
  Move = "move",
  Interact = "interact",
  SelectHotbar = "select-hotbar",
  Chat = "chat"
}

export enum ServerMessage {
  TaskTrigger = "task-trigger",
  TaskResult = "task-result",
  Notification = "notification"
}

/**
 * Movement payload sent by the client.
 */
export interface MovePayload {
  gridX: number;
  gridY: number;
}
