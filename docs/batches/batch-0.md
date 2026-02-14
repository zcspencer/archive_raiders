# Batch 0 Checklist: Project Scaffolding

## Objective

Stand up a runnable monorepo baseline with app shells and quality gates.

## Deliverables

- [x] pnpm workspace + turborepo config
- [x] root scripts for dev/build/typecheck/lint/test/content validation
- [x] client, server, admin package shells
- [x] shared and task-validators package shells
- [x] environment template and compose infrastructure
- [x] maintainability rules and handoff docs
- [x] successful `pnpm install`
- [x] successful `pnpm dev`
- [x] successful `pnpm typecheck`

## Manual verification

1. `docker compose up -d`
2. `pnpm install`
3. `pnpm dev`
4. Open:
   - client: `http://localhost:5173`
   - admin: `http://localhost:5174`
   - server health: `http://localhost:3000/health`

## Exit criteria

- All shell apps boot without runtime errors.
- Server responds with health payload.
- Client renders Phaser canvas and React overlay text.
- Admin renders dashboard placeholder page.
