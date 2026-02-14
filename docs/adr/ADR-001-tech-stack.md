# ADR-001: Core Technology Stack

## Status

Accepted

## Context

The project needs real-time multiplayer, content-driven classroom tasks, and maintainable implementation with strong TypeScript ergonomics.

## Decision

Adopt:

- Phaser + React for client rendering and overlays
- Colyseus for room-based state sync
- Fastify for REST API
- PostgreSQL for durable state
- Redis for sessions, cooldowns, and pub/sub
- Drizzle ORM for SQL-first typed schema access

## Consequences

- Strongly typed contracts and small modules improve AI-assisted coding quality.
- Task validation remains server-authoritative while keeping room loops responsive.
