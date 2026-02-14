import { Client, Room } from "colyseus";
import {
  ClientMessage,
  ServerMessage,
  hotbarSelectPayloadSchema,
  interactPayloadSchema,
  movePayloadSchema
} from "@odyssey/shared";
import type { AuthUser } from "@odyssey/shared";
import type { AuthService } from "../../auth/AuthService.js";
import type { ClassroomService } from "../../classroom/ClassroomService.js";
import { PlayerSchema, ShardState } from "../schema/ShardState.js";
import { applyInteraction } from "../services/interactionService.js";
import { applyMove } from "../services/movementService.js";

const HOTBAR_TOOL_MAP = ["axe", "watering_can", "seeds"] as const;

interface JoinOptions {
  accessToken?: string;
  classroomId?: string;
}

/**
 * Minimal classroom shard room used for Batch 0-1 integration.
 */
export class ShardRoom extends Room<ShardState> {
  private static services: RoomServices | null = null;

  /**
   * Configures room-level service dependencies.
   */
  static configureServices(services: RoomServices): void {
    ShardRoom.services = services;
  }

  private getServices(): RoomServices {
    if (!ShardRoom.services) {
      throw new Error("ShardRoom services are not configured");
    }
    return ShardRoom.services;
  }

  override onCreate(options: JoinOptions): void {
    const classroomId = options.classroomId ?? "default-classroom";
    this.setState(new ShardState(classroomId));

    this.onMessage(ClientMessage.Move, (client, rawPayload: unknown) => {
      const payloadResult = movePayloadSchema.safeParse(rawPayload);
      if (!payloadResult.success) {
        this.send(client, ServerMessage.Notification, "Invalid move payload");
        return;
      }
      const player = this.state.players.get(client.sessionId);
      if (!player) {
        return;
      }
      applyMove(player, payloadResult.data);
    });

    this.onMessage(ClientMessage.SelectHotbar, (client, rawPayload: unknown) => {
      const payloadResult = hotbarSelectPayloadSchema.safeParse(rawPayload);
      if (!payloadResult.success) {
        this.send(client, ServerMessage.Notification, "Invalid hotbar payload");
        return;
      }
      const player = this.state.players.get(client.sessionId);
      if (!player) {
        return;
      }
      player.selectedHotbarSlot = payloadResult.data.slotIndex;
      const mappedTool = HOTBAR_TOOL_MAP[payloadResult.data.slotIndex % HOTBAR_TOOL_MAP.length];
      player.equippedToolId = mappedTool ?? "axe";
    });

    this.onMessage(ClientMessage.Interact, (client, rawPayload: unknown) => {
      const payloadResult = interactPayloadSchema.safeParse(rawPayload);
      if (!payloadResult.success) {
        this.send(client, ServerMessage.Notification, "Invalid interact payload");
        return;
      }
      const player = this.state.players.get(client.sessionId);
      if (!player) {
        return;
      }
      const result = applyInteraction(player, this.state.tiles, payloadResult.data, Date.now());
      if (!result.accepted) {
        this.send(client, ServerMessage.Notification, result.reason);
      }
    });
  }

  override async onAuth(
    _client: Client,
    options: JoinOptions
  ): Promise<JoinAuthContext> {
    if (!options.accessToken) {
      throw new Error("Missing access token");
    }
    if (!options.classroomId) {
      throw new Error("Missing classroom id");
    }

    const { authService, classroomService } = this.getServices();
    const user = authService.getUserFromAccessToken(options.accessToken);
    if (!user) {
      throw new Error("Invalid token");
    }

    const allowed = await classroomService.isUserInClassroom(user, options.classroomId);
    if (!allowed) {
      throw new Error("Classroom access denied");
    }

    return { user, classroomId: options.classroomId };
  }

  override onJoin(client: Client): void {
    const authContext = client.auth as JoinAuthContext | undefined;
    if (!authContext) {
      throw new Error("Missing auth context");
    }
    if (authContext.classroomId !== this.state.classroomId) {
      throw new Error("Classroom mismatch for room join");
    }

    const player = new PlayerSchema();
    player.id = authContext.user.id;
    player.gridX = 10;
    player.gridY = 10;
    player.stamina = 100;
    player.maxStamina = 100;
    player.equippedToolId = "axe";
    player.selectedHotbarSlot = 0;
    player.axeLevel = 0;
    player.wateringCanLevel = 0;
    player.seedsLevel = 0;
    player.lastInteractAtMs = 0;
    this.state.players.set(client.sessionId, player);
  }

  override onLeave(client: Client): void {
    this.state.players.delete(client.sessionId);
  }
}

interface RoomServices {
  authService: AuthService;
  classroomService: ClassroomService;
}

interface JoinAuthContext {
  user: AuthUser;
  classroomId: string;
}
