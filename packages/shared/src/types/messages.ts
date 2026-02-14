export enum ClientMessage {
  Move = "move",
  Interact = "interact",
  Chat = "chat"
}

export enum ServerMessage {
  TaskTrigger = "task-trigger",
  TaskResult = "task-result",
  Notification = "notification"
}
