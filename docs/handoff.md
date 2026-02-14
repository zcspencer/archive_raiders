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

## Agent 4 - Batch 3 integration tests + room auth + task submission + client join

- Scope completed
  - Added Postgres integration test suites for `AuthService` and `ClassroomService`, including CI Postgres service wiring and a server integration test script.
  - Implemented authenticated classroom-scoped Colyseus room joins in `ShardRoom` using server `AuthService` and `ClassroomService`.
  - Implemented task submission REST flow (`POST /tasks/:taskId/submit`) with `TaskService` loading content definitions and executing validator registry functions.
  - Implemented client classroom selection and Colyseus `joinOrCreate("shard")` lifecycle hook after authentication.
  - Fixed NodeNext import/export compatibility gaps in shared/task-validator modules discovered during verification.
- Files changed
  - `.github/workflows/ci.yml`
  - `client/package.json`
  - `client/src/api/classrooms.ts`
  - `client/src/hooks/useColyseusRoom.ts`
  - `client/src/store/classroom.ts`
  - `client/src/ui/App.tsx`
  - `docs/handoff.md`
  - `packages/shared/src/validators/player.schema.ts`
  - `packages/task-validators/package.json`
  - `packages/task-validators/src/index.ts`
  - `packages/task-validators/src/registry.ts`
  - `server/package.json`
  - `server/src/api/routes.ts`
  - `server/src/api/routes/task.test.ts`
  - `server/src/api/routes/task.ts`
  - `server/src/auth/AuthService.integration.test.ts`
  - `server/src/classroom/ClassroomService.integration.test.ts`
  - `server/src/classroom/ClassroomService.test.ts`
  - `server/src/classroom/ClassroomService.ts`
  - `server/src/colyseus/rooms/ShardRoom.ts`
  - `server/src/config.ts`
  - `server/src/index.ts`
  - `server/src/task/TaskService.test.ts`
  - `server/src/task/TaskService.ts`
  - `server/src/test/integration.ts`
  - `pnpm-lock.yaml`
- Commands run and outcomes
  - `pnpm install --frozen-lockfile` -> pass.
  - `pnpm --filter @odyssey/server test` -> pass.
  - `pnpm --filter @odyssey/server test:integration` -> pass (tests skipped locally because `TEST_DATABASE_URL` not set).
  - `pnpm install --no-frozen-lockfile` -> failed once due invalid `colyseus.js` version; pass after version correction.
  - `pnpm typecheck` -> failed initially on task-validator export path issues; pass after NodeNext import/export fixes and package typing updates.
  - `pnpm lint && pnpm test && pnpm build && pnpm content:validate` -> lint/test/build pass; content validate failed in sandbox due `tsx` IPC `EPERM`.
  - `pnpm content:validate` (outside sandbox) -> pass.
- Known risks/blockers
  - Integration suites currently gate on `TEST_DATABASE_URL`/`DATABASE_URL`; they skip when DB env is absent locally.
  - Task definition lookup currently scans JSON content recursively per submission; acceptable for baseline but should be indexed/cached at scale.
  - Client build chunk-size warning remains non-blocking.
- Next recommended task
  - Agent 5 should add classroom enrollment/membership modeling (instead of broad student classroom visibility) and enforce it consistently across REST and room auth checks.

## Agent 5 - Classroom membership enforcement + enrollment route

- Scope completed
  - Added persisted classroom membership schema in PostgreSQL bootstrap migrations.
  - Enforced membership-based classroom visibility for students in `ClassroomService`.
  - Added teacher-managed enrollment endpoint `POST /classrooms/:classroomId/memberships`.
  - Added/updated unit, integration, and route tests for enrolled vs unenrolled behavior.
  - Updated client overlay with a clear empty enrollment state message.
  - Updated handoff docs to queue the next infra/perf follow-ups.
- Files changed
  - `server/src/db/postgres.ts`
  - `server/src/test/integration.ts`
  - `server/src/classroom/ClassroomService.ts`
  - `server/src/classroom/ClassroomService.test.ts`
  - `server/src/classroom/ClassroomService.integration.test.ts`
  - `server/src/api/routes/classroom.ts`
  - `server/src/api/routes/classroom.test.ts`
  - `packages/shared/src/types/classroom.ts`
  - `packages/shared/src/validators/classroom.schema.ts`
  - `client/src/ui/App.tsx`
  - `docs/handoff.md`
  - `docs/implementation-roadmap.md`
- Commands run and outcomes
  - `pnpm install` -> pass.
  - `pnpm --filter @odyssey/shared build` -> pass.
  - `pnpm --filter @odyssey/server exec vitest run src/api/routes/classroom.test.ts` -> pass.
  - `pnpm --filter @odyssey/shared build && pnpm typecheck && pnpm lint && pnpm test && pnpm build` -> pass.
  - `pnpm content:validate` -> fails in sandbox with `tsx` IPC `EPERM`; pass outside sandbox.
- Known risks/blockers
  - Integration suites continue to skip locally without `TEST_DATABASE_URL`/`DATABASE_URL`.
  - Dist artifacts are checked in for some packages; source/schema changes may require package builds before tests in some local workflows.
  - Client build chunk-size warning remains non-blocking.
- Next recommended task
  - Agent 6 should execute queued follow-ups in this order:
    1. add dev Dockerfiles for `server`, `client`, and `admin`
    2. reduce client bundle size via code-splitting/manual chunks
    3. add task-definition indexing/cache in `TaskService`
    4. replace bootstrap SQL migrations with dedicated migration tooling
