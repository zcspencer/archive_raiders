/**
 * Subset of the Tiled JSON tilemap format used by the village map.
 * Only the fields our loader cares about are declared.
 */

/**
 * A single object in a Tiled object layer.
 */
export interface TiledObject {
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  properties?: TiledProperty[];
}

/**
 * Custom property attached to a Tiled object.
 */
export interface TiledProperty {
  name: string;
  type: string;
  value: string | number | boolean;
}

/**
 * A single layer in the Tiled JSON map.
 */
export interface TiledLayer {
  name: string;
  type: "tilelayer" | "objectgroup";
  width?: number;
  height?: number;
  data?: number[];
  objects?: TiledObject[];
  visible: boolean;
}

/**
 * Top-level Tiled JSON map structure (minimal subset).
 */
export interface TiledMapData {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: TiledLayer[];
}

/**
 * Parsed NPC placement from the map object layer.
 */
export interface MapNpcPlacement {
  npcId: string;
  gridX: number;
  gridY: number;
}

/**
 * Parsed interactable object placement from the map object layer.
 */
export interface MapObjectPlacement {
  objectId: string;
  kind: string;
  label: string;
  gridX: number;
  gridY: number;
}
