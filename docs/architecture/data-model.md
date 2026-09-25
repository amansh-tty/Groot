# Local data model

## Implemented in migration 1

`schema_migrations(version PRIMARY KEY, name, applied_at)` records contiguous, applied migrations. `app_settings(id=1, accent, updated_at)` stores the current appearance preference. Accent is constrained in both SQLite and Zod. Data timestamps are UTC ISO strings. Startup applies pending migrations inside `BEGIN IMMEDIATE`; failures roll back and close the connection.

The only database file is `<data-dir>/playground.sqlite`, with SQLite-managed WAL/SHM companions. No user-selected filesystem path is accepted by an HTTP route. Data directory override is trusted local process configuration, not model output.

## Planned entities (not migrated yet)

- Project: server-generated UUID, name, description, category, created/updated timestamps.
- ProductContext: project ID, structured overview/users/problems/goals/principles/constraints/terminology/design system; separately identified facts, decisions, assumptions and proposals.
- Flow: project ID, name, optional ordered prototype IDs.
- Prototype: project ID, active implementation reference, last working build reference.
- PrototypeVersion: prototype ID, immutable snapshot manifest/hash, label, description, optional parent version and timestamp.
- Conversation / Message: project/prototype ownership, ordered role/content, task status and sanitized error/events.
- AIProviderSettings: provider/model IDs and connection metadata only; no secret embedded in project data.
- OnboardingState: resumable step and project reference, with completion stored only when corresponding work succeeds.
- FileChangeAudit: request ID, project ID, path, before/after content hash and promotion outcome.

Create tables only when their phase consumes them. Enforce foreign keys and parameterized queries. Snapshots store manifests and source under server-owned project directories. File transactions require a staged write/recovery journal because a SQLite commit cannot atomically include filesystem changes.

Portable import/export is Phase 6: a versioned manifest plus allowed relative source paths, context, conversation and snapshots. Never export provider secrets or absolute paths. Bound sizes/counts, validate paths and schema before importing into a new project, and reject duplicate/path-conflicting entries. Never run imported scripts.
