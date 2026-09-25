# Application architecture

> Historical Phase 1 overview. Current runtime: [V1 workbench](v1-workbench.md).

## Implemented foundation

React/Vite renders a local browser application. Tailwind v4 provides utilities around CSS custom-property tokens. The shadcn/ui button is source-owned, uses Radix Slot and class-variance-authority, and Lucide supplies icons. Zustand holds loading/error/appearance state; SQLite is the authority for saved preferences. No application data is persisted in localStorage.

During development, Vite on loopback port 5173 proxies `/api` to Fastify on loopback port 4310. In production, Fastify serves only `apps/web/dist` plus its API. It never statically serves the data root or repository root. Unknown API and file routes return JSON 404s. Frontend requests validate responses using shared Zod contracts and time out after eight seconds.

Node's built-in synchronous SQLite driver avoids a separate service and external native-addon setup. Queries are short and indexed for a single local user. Long-running compilation and model work must remain asynchronous or move to a bounded worker; they must not block the API loop. WAL, foreign keys and a five-second busy timeout are enabled. Migration history and the singleton settings row are created transactionally; unsupported future histories fail closed.

The `development` package export condition enables shared source changes in Vite/tsx/Vitest. Production packages expose compiled JS and declaration files; pnpm builds the dependency graph in topological order. `pnpm typecheck` independently checks all source and test files.

## Package boundaries

- `shared`: schemas and neutral DTOs; no filesystem, credentials or provider SDK.
- `ai`: backend-only provider contract; returns text/events/file proposals, never writes files itself.
- `prototype-runtime`: future compiler/preview integration. Today it exports policy/viewport constants only.
- `server`: storage, request policy, future context assembly, credential handling and audited file promotion.
- `web`: designer workflows, UI primitives, future iframe host and event display.

## Current routes

- `GET /api/health`: executes a database query and reports app/schema/implementation status without secrets or filesystem paths.
- `GET /api/settings`: retrieves persisted accent.
- `PUT /api/settings`: validates the entire settings payload, rejects unknown keys, saves and returns the persisted value.

Mutation requests require an exact trusted Origin and JSON content type. Requests with foreign Host, foreign Origin (including `null`) or cross-site Fetch Metadata are rejected. The production app adds restrictive CSP, no-sniff, no-store and frame protection headers. Development Vite is a developer server; use the compiled app for a narrower serving surface. The application is not a multi-user service and must not be exposed publicly.

## Future workspace

Use independent ProjectSidebar, PrototypeWorkspace and ConversationPanel components. The center owns viewport and preview state; it should not depend on a future infinite-canvas engine. Keep project selection, active prototype/version and conversation IDs explicit. New versions will be additive immutable snapshots; last working previews survive failed candidates.
