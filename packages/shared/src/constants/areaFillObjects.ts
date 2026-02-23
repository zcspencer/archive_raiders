/** Configuration for world objects that expand an area into a grid of individual tile placements. */
export interface AreaFillConfig {
  /** Item definition ID to use for each individual tile in the filled area. */
  fillDefinitionId: string;
}

/**
 * Maps placement-only definition IDs (used in Tiled map objects) to their
 * per-tile fill configuration. When a world_object with one of these
 * definition_ids is encountered during map parsing, its bounding rectangle
 * is expanded into individual single-tile placements.
 */
export const AREA_FILL_OBJECTS: Record<string, AreaFillConfig> = {
  rock_pile: { fillDefinitionId: "rock" },
};
