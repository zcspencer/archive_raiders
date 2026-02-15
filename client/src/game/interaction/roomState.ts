/**
 * Snapshot of a player from room state (position and equipment for rendering).
 */
export interface PlayerSnapshot {
  sessionId: string;
  currentMapKey: string;
  gridX: number;
  gridY: number;
  equippedHandDefId?: string;
  equippedHeadDefId?: string;
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
  localMapKey: string,
  existingSessionIds: string[]
): DiffResult {
  const upserts = snapshots.filter(
    (snapshot) => snapshot.sessionId !== localSessionId && snapshot.currentMapKey === localMapKey
  );
  const activeIds = new Set(upserts.map((snapshot) => snapshot.sessionId));
  const removals = existingSessionIds.filter((sessionId) => !activeIds.has(sessionId));
  return { upserts, removals };
}

function toSnapshot(sessionId: string, value: unknown): PlayerSnapshot | null {
  const maybePlayer = value as {
    currentMapKey?: string;
    gridX?: number;
    gridY?: number;
    equippedHandDefId?: string;
    equippedHeadDefId?: string;
  };
  if (
    typeof maybePlayer.currentMapKey !== "string" ||
    typeof maybePlayer.gridX !== "number" ||
    typeof maybePlayer.gridY !== "number"
  ) {
    return null;
  }
  return {
    sessionId,
    currentMapKey: maybePlayer.currentMapKey,
    gridX: maybePlayer.gridX,
    gridY: maybePlayer.gridY,
    equippedHandDefId:
      typeof maybePlayer.equippedHandDefId === "string" && maybePlayer.equippedHandDefId !== ""
        ? maybePlayer.equippedHandDefId
        : undefined,
    equippedHeadDefId:
      typeof maybePlayer.equippedHeadDefId === "string" && maybePlayer.equippedHeadDefId !== ""
        ? maybePlayer.equippedHeadDefId
        : undefined
  };
}
