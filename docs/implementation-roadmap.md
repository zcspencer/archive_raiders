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

## Contracts that must remain stable

- Task validator function signature
- `TaskDefinition` and `TaskResult` shapes
- Colyseus room name `shard`
- Health endpoint `GET /health`

## Definition of done for handoff batches

- strict typecheck passes
- no new lint diagnostics
- changed behavior has tests
- docs and ADR updated for contract changes

## Immediate next steps (Post Batch 2)

1. Add DB integration tests against a real Postgres service for auth/classroom flows.
2. Connect client to Colyseus room join flow after authenticated classroom selection.
3. Implement task submission REST endpoints and wire validator execution server-side.
4. Add Dockerfiles for client/server/admin development images.
5. Reduce client production bundle size (code-splitting/manual chunks).
