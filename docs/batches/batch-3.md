# Batch 3 Checklist: Tile Maps + Village World

## Objective

Implement a real village map with tile-based collision, NPCs, interactable objects, a dialogue system, and a basic player sprite with 4-direction walk animation.

## Deliverables

- [x] Shared NPC/dialogue/map types and Zod schemas in `packages/shared`
- [x] NPC dialogue content files: `content/npcs/village_elder.json`, `content/npcs/blacksmith.json`
- [x] Village map in Tiled JSON format: `content/maps/village.json` (24x18, three layers)
- [x] `TileMapManager` parses Tiled JSON, extracts collision, ground, and object data
- [x] `CollisionGrid` provides `isWalkable(gridX, gridY)` check
- [x] `tileRenderer` generates placeholder tileset texture and renders ground layer
- [x] `GridMovement` system: tile-by-tile movement with collision, smooth tweening
- [x] 4-direction player sprite generated at runtime via Phaser Graphics
- [x] `Npc` entity class with trigger zone and facing detection
- [x] `InteractableObject` entity class for chests, doors, artifacts, signs
- [x] `interactionDetection` system finds entities the player is facing
- [x] `dialogueStore` (Zustand) bridges Phaser interaction events with React
- [x] `DialogueBox` React component: speaker name, text, next/close controls
- [x] NPC dialogue loader with static imports and Zod validation
- [x] `VillageScene` integrates all systems (map, movement, entities, interaction)
- [x] `BootScene` refactored to preload-only (loads map, transitions to VillageScene)
- [x] `DialogueBox` wired into `App.tsx` with input mode switching
- [x] Tests for `CollisionGrid`, `TileMapManager`, `interactionDetection`, `dialogueStore`
- [x] Successful `pnpm typecheck`
- [x] Successful `pnpm lint`
- [x] Successful `pnpm test`
- [x] Successful `pnpm build`

## Manual verification

1. `docker compose up -d`
2. `pnpm --filter @odyssey/server dev`
3. `pnpm --filter @odyssey/client dev --host`
4. Register/login, select classroom, join room
5. Verify:
   - Village map renders with colored ground tiles
   - Player sprite with 4-direction facing
   - WASD movement is tile-by-tile with smooth tweening
   - Collision blocks movement into walls/water/buildings
   - NPCs (Elder Mira, Forgemaster Dain) visible on map
   - Press X facing an NPC opens dialogue box
   - Dialogue advances with X/Enter/Space, closes at end or with Escape
   - Interactable objects (chest, door) visible on map
   - Camera follows player
   - Remote players still render and sync

## Exit criteria

- Player can walk around the village map with tile-by-tile movement
- Collision prevents walking through walls, water, and buildings
- NPCs are visible and respond to the interact key with dialogue
- Dialogue box shows speaker name, text, and next/close controls
- Player sprite shows 4-direction facing with walk animation
- All quality gates pass (typecheck, lint, test, build)
