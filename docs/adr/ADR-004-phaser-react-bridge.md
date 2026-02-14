# ADR-004: Phaser + React with Event/Store Bridge

## Status

Accepted

## Context

Gameplay rendering and UI overlays have very different concerns and tooling needs.

## Decision

Use Phaser for world rendering and React for UI overlays, bridged through typed events and shared stores.

## Consequences

- Cleaner separation between world simulation and UI workflows
- Faster feature work for overlay-heavy literacy tasks
- Requires strict event contract discipline to avoid coupling drift
