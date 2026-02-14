# Batch 2 Checklist: Recovery + Persistence

## Objective

Recover source-of-truth integrity, add PostgreSQL-backed persistence for auth/classrooms, and establish enforceable quality gates.

## Deliverables

- [x] restored zero-byte critical source files and server package metadata
- [x] server boot path restored in source (`server/src/index.ts`, `server/src/api/routes.ts`)
- [x] shared task contracts/schemas restored in source
- [x] implemented PostgreSQL persistence for auth and classroom services
- [x] migrated runtime schema creation for `app_users` and `classrooms`
- [x] added lint setup with ESLint flat config and package-level lint scripts
- [x] replaced no-op test scripts with Vitest-backed scripts
- [x] added focused tests for server auth/classroom and task validator/shared schema behavior
- [x] implemented `scripts/validate-content.ts` JSON schema validation
- [x] CI runs typecheck + lint + test + build + content validation
- [x] successful `pnpm install --frozen-lockfile`
- [x] successful `pnpm typecheck`
- [x] successful `pnpm lint`
- [x] successful `pnpm test`
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

## Exit criteria

- Source files are authoritative again (no zero-byte runtime-critical files).
- Auth and classroom data persist across server restarts with PostgreSQL.
- Workspace lint and test run real checks (not echo placeholders).
- Content validation fails on invalid task JSON and passes on valid content.
