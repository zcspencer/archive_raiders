import { Client, Room } from "colyseus";
import { PlayerSchema, ShardState } from "../schema/ShardState.js";

interface JoinOptions {
  classroomId?: string;
}

interface MovePayload {
  gridX: number;
  gridY: number;
}

/**
 * Minimal classroom shard room used for Batch 0-1 integration.
 */
export class ShardRoom extends Room<ShardState> {
  override onCreate(options: JoinOptions): void {
    const classroomId = options.classroomId ?? "default-classroom";
    this.setState(new ShardState(classroomId));

    this.onMessage("move", (client, payload: MovePayload) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) {
        return;
      }
      player.gridX = payload.gridX;
      player.gridY = payload.gridY;
    });
  }

  override onJoin(client: Client): void {
    const player = new PlayerSchema();
    player.id = client.sessionId;
    player.gridX = 10;
    player.gridY = 10;
    this.state.players.set(client.sessionId, player);
  }

  override onLeave(client: Client): void {
    this.state.players.delete(client.sessionId);
  }
}
