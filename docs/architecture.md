# Architecture Overview (v1)

This document is the canonical architecture baseline for implementation batches.

## Goals

- Fun-first multiplayer classroom game loop
- Data-driven task content and progression
- Maintainable TypeScript-first codebase for AI-assisted development
- Horizontally scalable room model with authoritative server validation

## Core stack

- Client: Phaser 4 + React 19 + Zustand + Tailwind 4
- Multiplayer: Colyseus
- API: Fastify
- Data: PostgreSQL + Redis
- Shared contracts: `packages/shared`
- Task validation: `packages/task-validators`

## System boundaries

- Real-time movement, emotes, and world state use Colyseus.
- Task submission and validation use REST to keep room loops lightweight.
- Task validators are pure functions with no DB side effects.
- Classroom and role scoping are enforced server-side.

## Monorepo packages

- `client`: game and overlays
- `server`: Colyseus rooms + Fastify routes + services
- `admin`: teacher dashboard
- `packages/shared`: shared type contracts and constants
- `packages/task-validators`: validator registry by task type

## Non-negotiable maintainability rules

- Maximum 300 lines per source file
- Explicit TypeScript types for public APIs
- Barrel exports per directory
- JSDoc on public classes/functions
- Unit tests for services and validator logic

## Delivery model

- Implement in batches with acceptance criteria
- Each batch must be runnable and testable
- Preserve compatibility contracts in `packages/shared`
- Record architectural changes as ADRs in `docs/adr`
