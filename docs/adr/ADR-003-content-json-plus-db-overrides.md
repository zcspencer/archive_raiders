# ADR-003: Content Strategy

## Status

Accepted

## Context

Core learning content should be easy to version and edit outside admin tooling, while teachers still need classroom customizations.

## Decision

Store default content as JSON files in `content/`, and use database tables only for teacher-authored custom tasks and overrides.

## Consequences

- Git history captures content changes
- Content can be validated in CI without DB access
- Server needs cache invalidation or reload strategy for content updates
