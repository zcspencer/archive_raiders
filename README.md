# Odyssey Classroom IO Game

Monorepo for a classroom-safe, Stardew-like computer literacy game using Phaser + React + Colyseus + Fastify.

## Current status

This repository contains:

- Workspace + Turborepo foundation
- Auth and classroom API foundations with JWT auth
- PostgreSQL-backed auth/classroom persistence
- Shared task contracts and schema validation
- Task validator registry with tested `shortcut` validator
- Client/admin authentication and classroom management shells
- Lint + test scripts wired across workspace packages
- Content validation pipeline (`pnpm content:validate`)

## Quick start

1. Copy environment variables:
   - `cp .env.example .env`
2. Install dependencies:
   - `pnpm install`
3. Start infrastructure:
   - `docker compose up -d`
4. Start apps:
   - `pnpm dev`
5. Verify key checks:
   - `pnpm typecheck`
   - `pnpm lint`
   - `pnpm test`
   - `pnpm content:validate`

## Workspace layout

- `packages/shared`: shared types/constants/utils
- `packages/task-validators`: pure task validator registry
- `client`: Phaser + React application shell
- `server`: Fastify + Colyseus server shell
- `admin`: teacher dashboard shell
- `docs`: implementation plan, handoff notes, and ADRs

## Next milestone

Follow `docs/batches/batch-2.md` for Batch 2 recovery + persistence outcomes and remaining follow-up.
