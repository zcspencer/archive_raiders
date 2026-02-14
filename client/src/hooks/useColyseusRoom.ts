import { useEffect, useMemo, useState } from "react";
import { Client, type Room } from "colyseus.js";
import { useGameRoomBridgeStore } from "../store/gameRoomBridge";

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
    const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ??
      "http://localhost:3000";
    return new Client(apiBase.replace(/^http/i, "ws"));
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
