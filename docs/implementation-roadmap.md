# Implementation Roadmap

This roadmap is the handoff source of truth for future agents.

## What is already implemented

- Monorepo and task pipeline baseline
- Batch 1 auth/classroom contracts and APIs
- Batch 2 recovery of critical source files
- PostgreSQL-backed auth/classroom persistence
- Task content schema validation script
- ESLint + Vitest quality gates and focused domain tests
- CI pipeline running typecheck/lint/test/build/content validation
- Batch 3 village map with tile-based collision and grid movement
- NPC and interactable object entities placed from Tiled map data
- Dialogue system bridging Phaser interaction events with React overlay
- 4-direction player sprite with walk animation (runtime-generated)
- NPC dialogue content loaded from `content/npcs/*.json`

## Contracts that must remain stable

- Task validator function signature
- `TaskDefinition` and `TaskResult` shapes
- `NpcDefinition` and `DialogueLine` shapes
- `TiledMapData` and layer schemas
- Colyseus room name `shard`
- Health endpoint `GET /health`

## Definition of done for handoff batches

- strict typecheck passes
- no new lint diagnostics
- changed behavior has tests
- docs and ADR updated for contract changes

## Immediate next steps (Post Batch 3)

1. Add server-side collision validation using the same map data.
2. Add real art assets (tileset images, character sprites) replacing runtime-generated textures.
3. Add Dockerfiles for client/server/admin development images.
4. Reduce client production bundle size (code-splitting/manual chunks).
5. Add task-definition indexing/cache to avoid per-submission recursive JSON scans.
6. Replace bootstrap SQL migrations with dedicated migration tooling.
7. Implement NPC-triggered tasks (talk to NPC -> opens task overlay).
8. Add interactable object behavior (chest loot, door transitions).
