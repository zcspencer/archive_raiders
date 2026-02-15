import { useEffect, useMemo, useState } from "react";
import { Client, type Room } from "colyseus.js";
import type { CurrencyReward } from "@odyssey/shared";
import { ServerMessage } from "@odyssey/shared";
import { useContainerStore } from "../store/container";
import { useCurrencyStore } from "../store/currency";
import { useGameRoomBridgeStore } from "../store/gameRoomBridge";
import { usePlayerControlStore } from "../store/playerControl";
import { usePlayerInventoryStore } from "../store/playerInventory";

type ConnectionStatus = "idle" | "connecting" | "connected" | "error";

interface UseColyseusRoomOptions {
  accessToken: string | null;
  classroomId: string | null;
}

interface UseColyseusRoomValue {
  status: ConnectionStatus;
  errorMessage: string | null;
  sessionId: string | null;
}

/**
 * Connects the client to the classroom shard room.
 */
export function useColyseusRoom(
  options: UseColyseusRoomOptions
): UseColyseusRoomValue {
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const client = useMemo(() => {
    const explicitWs = import.meta.env.VITE_WS_URL as string | undefined;
    if (explicitWs) {
      return new Client(explicitWs);
    }
    const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
    if (apiUrl) {
      return new Client(apiUrl.replace(/^http/i, "ws"));
    }
    // Production: derive WebSocket URL from current origin via Caddy /colyseus proxy
    if (import.meta.env.PROD) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      return new Client(`${protocol}//${window.location.host}/colyseus`);
    }
    return new Client("ws://localhost:3000");
  }, []);

  useEffect(() => {
    const { setRoom, clearRoom } = useGameRoomBridgeStore.getState();
    let activeRoom: Room | null = null;
    let cancelled = false;

    async function connect(): Promise<void> {
      if (!options.accessToken || !options.classroomId) {
        clearRoom();
        setStatus("idle");
        setErrorMessage(null);
        setSessionId(null);
        return;
      }

      setStatus("connecting");
      setErrorMessage(null);
      try {
        activeRoom = await client.joinOrCreate("shard", {
          accessToken: options.accessToken,
          classroomId: options.classroomId
        });
        if (cancelled) {
          await activeRoom.leave();
          return;
        }
        setSessionId(activeRoom.sessionId);
        setStatus("connected");
        setRoom(activeRoom);

        activeRoom.onMessage(ServerMessage.Notification, (payload: unknown) => {
          const msg = typeof payload === "string" ? payload : String(payload);
          console.warn("[ShardRoom] Server notification:", msg);
          /* If a container is in "opening" state, close it so the user isn't stuck on "Loading..." */
          const container = useContainerStore.getState();
          if (container.currentContainerId && container.nonce === null) {
            container.closeContainer();
            usePlayerControlStore.getState().setInputMode("game");
          }
        });

        activeRoom.onMessage(ServerMessage.ContainerContents, (payload: unknown) => {
          if (payload && typeof payload === "object" && "objectId" in payload && "nonce" in payload && "items" in payload && "currencyRewards" in payload) {
            const p = payload as { objectId: string; nonce: string; items: Array<{ definitionId: string; name: string; quantity: number }>; currencyRewards: CurrencyReward[] };
            useContainerStore.getState().setContents({
              objectId: p.objectId,
              nonce: p.nonce,
              items: p.items,
              currencyRewards: p.currencyRewards
            });
          }
        });
        activeRoom.onMessage(ServerMessage.InventoryUpdate, (payload: unknown) => {
          if (Array.isArray(payload)) {
            usePlayerInventoryStore.getState().setItems(payload as import("@odyssey/shared").ItemInstance[]);
            useContainerStore.getState().closeContainer();
          }
        });
        activeRoom.onMessage(ServerMessage.CurrencyUpdate, (payload: unknown) => {
          if (payload && typeof payload === "object") {
            useCurrencyStore.getState().setBalances(payload as Record<string, number>);
          }
        });

        activeRoom.onLeave((code) => {
          if (cancelled) {
            return;
          }
          setStatus("error");
          setErrorMessage(`Disconnected from room (code: ${code})`);
        });

        activeRoom.onError((code, message) => {
          if (cancelled) {
            return;
          }
          setStatus("error");
          setErrorMessage(`Room error (${code}): ${message}`);
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        clearRoom();
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Join failed");
      }
    }

    void connect();

    return () => {
      cancelled = true;
      clearRoom();
      void activeRoom?.leave();
    };
  }, [client, options.accessToken, options.classroomId]);

  return {
    status,
    errorMessage,
    sessionId
  };
}
