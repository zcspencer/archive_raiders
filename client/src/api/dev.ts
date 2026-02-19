import type {
  TiledMapData,
  ItemDefinition,
  NpcDefinition,
  TaskDefinition
} from "@odyssey/shared";
import { requestJson } from "./client";

export interface ReloadContentResult {
  ok: boolean;
  items: number;
}

/** All content served fresh from disk by the dev server endpoint. */
export interface DevContentPayload {
  maps: Record<string, TiledMapData>;
  items: Record<string, ItemDefinition>;
  npcs: Record<string, NpcDefinition>;
  tasks: Record<string, TaskDefinition>;
}

/**
 * Reloads server-side content caches from disk (items, containers, loot tables).
 */
export async function reloadServerContent(): Promise<ReloadContentResult> {
  return requestJson<ReloadContentResult>("/dev/reload-content", {
    method: "POST",
    body: "{}"
  });
}

/**
 * Fetches all content (maps, items, NPCs, tasks) fresh from disk via the dev server.
 */
export async function fetchAllContent(): Promise<DevContentPayload> {
  return requestJson<DevContentPayload>("/dev/content");
}
