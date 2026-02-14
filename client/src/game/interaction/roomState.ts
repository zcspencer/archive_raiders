/**
 * Snapshot of a player position from room state.
 */
export interface PlayerSnapshot {
  sessionId: string;
  gridX: number;
  gridY: number;
}

interface RoomLike {
  sessionId?: string;
  state?: {
    players?: unknown;
  };
}

interface DiffResult {
  upserts: PlayerSnapshot[];
  removals: string[];
}

/**
 * Reads player snapshots from the current room state shape.
 */
export function readPlayerSnapshots(room: unknown): PlayerSnapshot[] {
  if (!room) {
    return [];
  }
  const maybeRoom = room as RoomLike;
  const players = maybeRoom.state?.players;
  if (!players) {
    return [];
  }

  const snapshots: PlayerSnapshot[] = [];
  const mapLike = players as {
    forEach?: (callback: (value: unknown, key: string) => void) => void;
  };
  if (typeof mapLike.forEach === "function") {
    mapLike.forEach((value, sessionId) => {
      const snapshot = toSnapshot(sessionId, value);
      if (snapshot) {
        snapshots.push(snapshot);
      }
    });
    return snapshots;
  }

  const plain = players as Record<string, unknown>;
  for (const [sessionId, value] of Object.entries(plain)) {
    const snapshot = toSnapshot(sessionId, value);
    if (snapshot) {
      snapshots.push(snapshot);
    }
  }
  return snapshots;
}

/**
 * Computes remote-player upserts and removals.
 */
export function diffRemotePlayers(
  snapshots: PlayerSnapshot[],
  localSessionId: string | null,
  existingSessionIds: string[]
): DiffResult {
  const upserts = snapshots.filter((snapshot) => snapshot.sessionId !== localSessionId);
  const activeIds = new Set(upserts.map((snapshot) => snapshot.sessionId));
  const removals = existingSessionIds.filter((sessionId) => !activeIds.has(sessionId));
  return { upserts, removals };
}

function toSnapshot(sessionId: string, value: unknown): PlayerSnapshot | null {
  const maybePlayer = value as { gridX?: number; gridY?: number };
  if (typeof maybePlayer.gridX !== "number" || typeof maybePlayer.gridY !== "number") {
    return null;
  }
  return {
    sessionId,
    gridX: maybePlayer.gridX,
    gridY: maybePlayer.gridY
  };
}
