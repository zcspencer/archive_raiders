# Implementation Roadmap

This roadmap is the handoff source of truth for future agents.

## What is already implemented

### Foundation (Batch 0-2)

- Monorepo scaffold (pnpm workspaces + Turborepo)
- Batch 1 auth/classroom contracts and APIs
- Batch 2 recovery of critical source files
- PostgreSQL-backed auth/classroom persistence
- Task content schema validation script (`pnpm content:validate`)
- ESLint + Vitest quality gates and focused domain tests
- CI pipeline running typecheck/lint/test/build/content validation

### World & Movement (Batch 3)

- Village map with tile-based collision and grid movement
- NPC and interactable object entities placed from Tiled map data
- Dialogue system bridging Phaser interaction events with React overlay
- 4-direction player sprite with walk animation (runtime-generated)
- NPC dialogue content loaded from `content/npcs/*.json`

### Multiplayer

- Colyseus shard room (one per classroom)
- Server-authoritative movement sync via `Move` and `SetMap` messages
- Remote player reconciliation (`RemotePlayersController`)
- JWT-based room auth with classroom membership checks

### Inventory, Equipment & Currency

- Server-authoritative inventory with nested item trees (`InventoryService`)
- Equipment system with hand/head slots (`EquipmentService`)
- Currency balances (coins, museum_points) via `CurrencyService`
- Full-snapshot `InventoryUpdate` and `CurrencyUpdate` messages
- Starter item seeding on first join (axe, watering-can, seeds-bag)

### Containers & Loot

- Container interaction flow (open -> preview -> claim)
- Nonce-based idempotent claim via `ContainerService`
- Loot table definitions (`content/containers/*.container.json`) with `loot` or `drops`
- `LootResolver` + `LootTableLoader` for tiered/weighted loot resolution

### Item System

- Data-driven item definitions (`content/items/*.item.json`)
- Component registry (Equippable, Cosmetic, Readable, Container)
- Item action resolver (drop, equip, unequip, use, read, open)
- Equipment-based tool interactions (`toolRules.ts`)
- Equipment sprite rendering with per-direction anchors

### Challenges & Readable Items

- Challenge overlay system (CopyPaste, FindCopyPaste, ZoomDiscover)
- Readable items with content dialog (`ReadableContentDialog`)
- Challenge-gated readable content

### Map Transitions

- Scene transitions via door interactions (Village, EldersHouse, MosslightCottage, TimberNook)
- `SetMap` message to sync current map context to server

### Invite System

- Teacher-created classroom invites with email delivery (SES)
- Student invite acceptance with auto-enrollment
- Public registration toggle (`ALLOW_PUBLIC_REGISTRATION`)

### Admin Dashboard

- Teacher login and classroom management
- Student roster and economy views
- Invite creation and listing

## Contracts that must remain stable

- Task validator function signature
- `TaskDefinition` and `TaskResult` shapes
- `NpcDefinition` and `DialogueLine` shapes
- `TiledMapData` and layer schemas
- `ItemDefinition` / `ItemInstance` shapes
- `ContainerDefinition` shape
- `ClientMessage` / `ServerMessage` enums (additive only)
- Colyseus room name `shard`
- Health endpoint `GET /health`

## Definition of done for handoff batches

- strict typecheck passes
- no new lint diagnostics
- changed behavior has tests
- docs and ADR updated for contract changes

## Immediate next steps

1. Add server-side collision validation using the same map data.
2. Add real art assets (tileset images, character sprites) replacing runtime-generated textures.
3. Reduce client production bundle size (code-splitting/manual chunks).
4. Replace bootstrap SQL migrations with dedicated migration tooling.
5. Expand content: new maps, NPCs, items, containers, and task types.
6. Implement `UseItem` message handler (currently planned but unimplemented).
7. Add Dockerfiles for client/server/admin development images.
