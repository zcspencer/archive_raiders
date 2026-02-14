# Multi-Agent Handoff Plan

Use this file to coordinate work across agents without losing context.

## Current baseline

- Repository scaffolding is complete for Batch 0.
- Architecture baseline and implementation checklist are in `docs/`.
- Cursor rules are expected to enforce maintainable patterns.

## Parallelizable workstreams

1. **Foundation QA agent**
   - install dependencies
   - run workspace scripts
   - fix wiring issues only
2. **Server agent**
   - Batch 1 auth and classroom APIs
   - keep services pure and tested
3. **Client agent**
   - login/register shell and colyseus client hook
4. **Shared contracts agent**
   - build type interfaces + zod validators
5. **Infra agent**
   - Dockerfiles, compose prod profile, CI pipeline

## Required conventions

- Touch only files in your scope branch.
- Preserve public shared contracts unless approved in ADR.
- Add/update tests with every behavior change.
- Update docs when adding architecture-level decisions.

## Handoff note template

Each agent should append:

- Scope completed
- Files changed
- Commands run and outcomes
- Known risks/blockers
- Next recommended task

## Agent 1 - Batch 0 verification + CI workflow

- Scope completed
  - Verified Batch 0 baseline commands and runtime boot behavior.
  - Fixed minimal root causes blocking verification (server ESM import extensions and Colyseus transport version alignment).
  - Added GitHub Actions CI workflow for push and pull request checks.
  - Updated Batch 0 checklist statuses to reflect completed verification.
- Files changed
  - `.github/workflows/ci.yml`
  - `server/src/index.ts`
  - `server/src/colyseus/rooms/ShardRoom.ts`
  - `server/package.json`
  - `pnpm-lock.yaml`
  - `docs/batches/batch-0.md`
  - `docs/handoff.md`
- Commands run and outcomes
  - `pnpm install` -> pass (after rerun with unrestricted permissions due initial stalled process).
  - `pnpm typecheck` -> failed initially on NodeNext import extension errors; pass after fixes.
  - `pnpm build` -> failed initially on same import extension errors; pass after fixes.
  - `pnpm content:validate` -> pass (sandbox run failed with IPC EPERM; unrestricted run passes).
  - `docker compose up -d` -> pass (postgres and redis started).
  - `pnpm --filter @odyssey/server dev` -> failed initially due `@colyseus/ws-transport` mismatch; pass after dependency alignment.
  - `pnpm --filter @odyssey/client dev --host` -> pass.
  - `pnpm --filter @odyssey/admin dev --host --port 5174` -> pass.
  - `curl -sS http://localhost:3000/health` -> `{"status":"ok"}`.
  - `pnpm install --frozen-lockfile && pnpm typecheck && pnpm build && pnpm content:validate` -> pass.
  - `pnpm dev` -> pass (all dev processes booted; `/health` verified while running).
- Known risks/blockers
  - Client production build reports a large chunk size warning; non-blocking for Batch 0 baseline.
  - Local verification required killing lingering prior dev processes to avoid port conflicts.
- Next recommended task
  - Agent 2 can begin Batch 1 feature implementation on top of this verified baseline and CI gate.

## Agent 2 - Batch 1 full implementation

- Scope completed
  - Implemented Batch 1 shared contracts and zod schemas for auth, classroom, and player.
  - Implemented server auth/classroom foundations: register/login routes, JWT helpers, auth and role middleware, `AuthService`, and `ClassroomService`.
  - Implemented client auth shell with login/register flows, typed REST calls, and persisted session bootstrap.
  - Implemented admin teacher session flow with login/register, protected dashboard, and classroom creation/listing.
  - Added Batch 1 checklist doc and completed verification updates.
- Files changed
  - `packages/shared/src/types/auth.ts`
  - `packages/shared/src/types/classroom.ts`
  - `packages/shared/src/types/player.ts`
  - `packages/shared/src/validators/auth.schema.ts`
  - `packages/shared/src/validators/classroom.schema.ts`
  - `packages/shared/src/validators/player.schema.ts`
  - `packages/shared/src/index.ts`
  - `packages/shared/package.json`
  - `server/src/auth/jwt.ts`
  - `server/src/auth/AuthService.ts`
  - `server/src/classroom/ClassroomService.ts`
  - `server/src/api/middleware/auth.ts`
  - `server/src/api/middleware/role.ts`
  - `server/src/api/routes/auth.ts`
  - `server/src/api/routes/classroom.ts`
  - `server/src/api/routes.ts`
  - `server/src/config.ts`
  - `server/src/index.ts`
  - `server/package.json`
  - `client/src/api/client.ts`
  - `client/src/api/auth.ts`
  - `client/src/store/auth.ts`
  - `client/src/ui/screens/LoginScreen.tsx`
  - `client/src/ui/screens/RegisterScreen.tsx`
  - `client/src/ui/App.tsx`
  - `admin/src/api/client.ts`
  - `admin/src/api/auth.ts`
  - `admin/src/api/classrooms.ts`
  - `admin/src/session/authSession.ts`
  - `admin/src/ui/LoginScreen.tsx`
  - `admin/src/ui/Dashboard.tsx`
  - `admin/src/App.tsx`
  - `admin/package.json`
  - `docs/batches/batch-1.md`
  - `docs/handoff.md`
  - `pnpm-lock.yaml`
- Commands run and outcomes
  - `pnpm install --no-frozen-lockfile` -> pass.
  - `pnpm install --frozen-lockfile` -> pass.
  - `pnpm typecheck` -> failed initially due shared package type resolution under NodeNext; failed again after adding player schema due missing `.js` import extension; pass after ESM export path fixes.
  - `pnpm build` -> pass.
  - `pnpm content:validate` -> pass.
  - `docker compose up -d` -> pass.
  - `pnpm --filter @odyssey/server dev` -> pass.
  - `pnpm --filter @odyssey/client dev --host` -> pass.
  - `pnpm --filter @odyssey/admin dev --host --port 5174` -> pass.
  - `curl -sS http://localhost:3000/health` -> `{"status":"ok"}`.
  - `curl` API smoke sequence:
    - `POST /auth/register` (teacher) -> pass.
    - `POST /classrooms` with teacher bearer token -> pass.
    - `GET /classrooms` with teacher bearer token -> pass.
    - `POST /classrooms` with student bearer token -> 403 `{"error":"Insufficient role"}` as expected.
- Known risks/blockers
  - Batch 1 uses in-memory user/classroom storage for baseline behavior; data resets on server restart.
  - Client build chunk-size warning remains non-blocking.
- Next recommended task
  - Agent 3 should add persistent auth/classroom storage (DB) and automated tests around auth/classroom service and route behavior.

## Agent 3 - Batch 2 recovery + persistence + quality gates

- Scope completed
  - Restored zero-byte runtime-critical files in server/shared/scripts and recreated `server/package.json`.
  - Implemented PostgreSQL-backed persistence in `AuthService` and `ClassroomService`.
  - Added DB schema bootstrap (`app_users`, `classrooms`) and startup migration hook.
  - Replaced no-op lint/test scripts with real ESLint/Vitest execution across packages.
  - Added focused tests for auth service, classroom service, task schema, and task validators.
  - Implemented content validation script that parses and validates `content/**/*.json` against shared schema.
  - Updated CI to run `typecheck`, `lint`, `test`, `build`, and `content:validate`.
  - Updated README, roadmap, and added Batch 2 checklist documentation.
- Files changed
  - `server/package.json`
  - `server/src/index.ts`
  - `server/src/api/routes.ts`
  - `server/src/api/routes/auth.ts`
  - `server/src/api/routes/classroom.ts`
  - `server/src/auth/AuthService.ts`
  - `server/src/auth/AuthService.test.ts`
  - `server/src/classroom/ClassroomService.ts`
  - `server/src/classroom/ClassroomService.test.ts`
  - `server/src/config.ts`
  - `server/src/db/postgres.ts`
  - `packages/shared/src/types/task.ts`
  - `packages/shared/src/validators/task.schema.ts`
  - `packages/shared/src/validators/task.schema.test.ts`
  - `packages/shared/package.json`
  - `packages/task-validators/package.json`
  - `packages/task-validators/src/registry.test.ts`
  - `packages/task-validators/src/validators/shortcut.test.ts`
  - `client/package.json`
  - `client/tsconfig.json`
  - `admin/package.json`
  - `admin/tsconfig.json`
  - `scripts/validate-content.ts`
  - `.github/workflows/ci.yml`
  - `eslint.config.mjs`
  - `README.md`
  - `docs/implementation-roadmap.md`
  - `docs/batches/batch-2.md`
  - `docs/handoff.md`
  - `pnpm-lock.yaml`
- Commands run and outcomes
  - `pnpm install --no-frozen-lockfile` -> pass (lockfile update for new dependencies).
  - `pnpm install --frozen-lockfile` -> pass.
  - `pnpm typecheck` -> failed initially on missing `vite/client` import-meta types in admin/client; pass after tsconfig fixes.
  - `pnpm lint` -> failed initially due test syntax error; pass after fix.
  - `pnpm test` -> pass (focused tests added in server/shared/task-validators; admin/client run with `--passWithNoTests`).
  - `pnpm build` -> pass (client chunk-size warning persists).
  - `pnpm content:validate` -> pass (sandbox run hits `tsx` IPC EPERM; unrestricted run passes).
  - `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm content:validate` -> pass.
- Known risks/blockers
  - DB migrations are bootstrap SQL in application code; no dedicated migration toolchain yet.
  - Server tests currently mock DB access; no live Postgres integration test coverage yet.
  - Client build chunk-size warning remains non-blocking.
- Next recommended task
  - Agent 4 should add DB integration tests and implement task submission REST endpoints with validator execution and classroom scoping.
