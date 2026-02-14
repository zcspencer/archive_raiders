# Batch 1 Checklist: Auth + Classroom Foundations

## Objective

Add a typed authentication and classroom management baseline across shared contracts, server APIs, client, and admin.

## Deliverables

- [x] shared `auth`, `player`, and `classroom` contracts with zod validation exports
- [x] server register/login endpoints with JWT issue/verify helpers
- [x] server auth + role middleware and classroom service/API routes
- [x] client login/register UI shell with typed REST calls and persisted session bootstrap
- [x] admin teacher-protected session with classroom creation flow
- [x] successful `pnpm install --frozen-lockfile`
- [x] successful `pnpm typecheck`
- [x] successful `pnpm build`
- [x] successful `pnpm content:validate`

## Manual verification

1. `docker compose up -d`
2. `pnpm --filter @odyssey/server dev`
3. `pnpm --filter @odyssey/client dev --host`
4. `pnpm --filter @odyssey/admin dev --host --port 5174`
5. Verify:
   - server health: `http://localhost:3000/health`
   - client app boot: `http://localhost:5173`
   - admin app boot: `http://localhost:5174`
6. API smoke tests:
   - register teacher via `POST /auth/register`
   - create classroom via `POST /classrooms` with teacher bearer token
   - list classrooms via `GET /classrooms`
   - verify student role is denied on `POST /classrooms`

## Exit criteria

- JWT bearer auth works for register/login.
- Teacher role can create and list owned classrooms.
- Student role cannot create classrooms.
- Client/admin auth shells bootstrap session state after reload.
