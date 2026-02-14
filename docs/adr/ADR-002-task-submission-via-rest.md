# ADR-002: Task Submission via REST

## Status

Accepted

## Context

Task submission can require retries, cooldown checks, validation, and persistence. Running this in the Colyseus room loop risks room responsiveness.

## Decision

Use REST endpoint submission for task attempts and keep Colyseus for trigger/broadcast events.

## Consequences

- Better request/response semantics and status handling
- Easier endpoint-level rate limiting and observability
- Colyseus room loops stay focused on realtime state sync
