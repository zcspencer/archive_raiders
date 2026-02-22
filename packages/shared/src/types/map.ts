/**
 * Subset of the Tiled JSON tilemap format used by map definitions.
 * Extended to support full Tiled 1.10+ format including polygon collision.
 */

/** Point in a polygon (Tiled uses object-relative coordinates). */
export interface TiledPoint {
  x: number;
  y: number;
}

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
  /** Whether the object is visible (default true). */
  visible?: boolean;
  /** Polygon points (object-relative); present when shape is polygon. */
  polygon?: TiledPoint[];
  /** True when the object is an ellipse. */
  ellipse?: boolean;
  /** Custom properties. */
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

/** Tileset reference in a Tiled map. */
export interface TiledTilesetRef {
  firstgid: number;
  source: string;
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
  visible?: boolean;
  x?: number;
  y?: number;
}

/**
 * Top-level Tiled JSON map structure.
 */
export interface TiledMapData {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  orientation?: string;
  renderorder?: string;
  tilesets?: TiledTilesetRef[];
  layers: TiledLayer[];
}

/**
 * Parsed NPC placement from the map object layer.
 * Uses snake_case for configurable identifiers.
 */
export interface MapNpcPlacement {
  npc_id: string;
  gridX: number;
  gridY: number;
  /** Whether to render the sprite (default true). */
  is_visible?: boolean;
  /** Whether the object blocks movement (default true). */
  is_collidable?: boolean;
}

/**
 * Parsed interactable object placement from the map object layer.
 * Uses snake_case for configurable identifiers.
 */
export interface MapObjectPlacement {
  object_id: string;
  kind: string;
  label: string;
  gridX: number;
  gridY: number;
  /** Optional task definition ID that gates this interaction. */
  task_id?: string;
  /** Whether to render the sprite (default true). */
  is_visible?: boolean;
  /** Whether the object blocks movement (default true). */
  is_collidable?: boolean;
}

/**
 * Parsed map transition (door/portal) from the map object layer.
 */
export interface MapTransition {
  name: string;
  gridX: number;
  gridY: number;
  destination_map: string;
  destination_spawn: string;
  label?: string;
  /** Optional task definition ID that gates this transition (door/portal). */
  task_id?: string;
  /** Whether to render the sprite (default true). */
  is_visible?: boolean;
  /** Whether the object blocks movement (default true). */
  is_collidable?: boolean;
}

/**
 * Parsed world object placement from the map object layer.
 * Used by the server to spawn destroyable objects (trees, rocks, etc.) at specific positions.
 */
export interface MapWorldObjectPlacement {
  definition_id: string;
  gridX: number;
  gridY: number;
}
