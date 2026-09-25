# Playground implementation plan

> Historical V0 plan, superseded by [V1](product/v1.md). Do not continue its provider/onboarding phases.

Status: Phase 1 implemented and validated. Phase 2 has not started. Phases are acceptance gates, not parallel deliverables. See `phase-1-validation.md` for evidence and limitations.

## Repository inspection

The supplied `Groot` directory was empty on 2026-09-23. There was no existing application, Git checkout, or repository guidance to preserve. The application lives in `playground/` so that its root matches the requested structure.

## Final structure

```text
playground/
  apps/web/                    React application, UI primitives, Zustand state
  apps/server/                 Fastify, SQLite migrations and local storage
  packages/shared/             Zod boundary schemas and shared types
  packages/ai/                 Provider-neutral request/event contract
  packages/prototype-runtime/  Preview policy; compiler and iframe host in Phase 4
  docs/architecture/           System, data, AI and sandbox design
  docs/product/                Vision, scope and roadmap
  docs/research/               Dependency evidence and research templates
  docs/decisions/              Small dated decision records
  skills/                     Four focused design-engineering skills
  examples/dental-clinic/      Fictional fixture; executable example in Phase 6
  tests/e2e/                  Browser acceptance tests
  scripts/                    Cross-platform development and smoke helpers
```

UI primitives stay inside `apps/web` until another consumer needs them. Shared packages expose TypeScript source to Vite/tsx; production uses compiled package exports and pnpm's topological build order. No orchestrator, cloud service, Docker, application login, or autonomous agent infrastructure.

## Phase 1 — Foundation

- Pin verified packages and pnpm; strict TypeScript, ESLint, Prettier, Vitest and Playwright.
- Build a local React shell with dark tokens, shadcn/ui primitives, accessible states and Zustand.
- Start Fastify on loopback; Vite proxies API requests in development; Fastify serves the built application in production.
- Establish validated shared settings and health contracts. Persist appearance settings in SQLite with transactional migrations, making storage testable without implementing onboarding early.
- Locate data outside the repository by default. Reject untrusted hosts and browser origins; require JSON for mutations; never return secrets.
- Gate: install, lint, typecheck, unit/integration tests, build, browser workflow, real production launch and restart persistence must pass.

## Phase 2 — Onboarding

Persist resumable steps. Welcome/example choice, API-key configuration, minimal real verification request, project creation and optional structured context. Credentials live only on the backend, outside project directories; never round-trip saved keys. Distinguish subscription billing from API billing and local storage from remote inference. Gate: creation/context/restart/onboarding tests and mocked provider success/auth/network errors; live verification only with a user-provided key.

## Phase 3 — Workspace

Implement the three-region workspace, project switcher, context editor, flows/prototypes navigation and persistent conversation. Collapse chat and prioritize preview space. Context separates facts, decisions, assumptions and proposals. Gate: reopen project, edit/reload context, chat persistence and keyboard/mobile checks.

## Phase 4 — AI and prototypes

Implement Anthropic Messages API behind the provider contract, streaming and cancellation. Build bounded context from structured facts, applicable decisions, available components, active source and recent conversation. Validate structured file proposals; stage changes in a project-owned directory, compile against an allowlist in a bounded worker, record an audit entry and promote only successful candidates. No shell tools or package installs. Preserve last known working source. Preview on a separate origin with opaque iframe sandbox, restrictive CSP and narrowly validated diagnostic messages. Gate: mocked generate/modify/cancel/error paths, compile/runtime failure recovery, traversal/symlink/import and hostile preview tests. Do not call the sandbox secure before these tests pass.

## Phase 5 — Versions

Immutable named snapshots, descriptions, restore and duplicate-as-alternative, with metadata/source consistency and recovery after interruption. Restore never removes snapshots. Gate: snapshot immutability, restored content, duplicate independence, restart and interrupted-write tests.

## Phase 6 — Quality

Portable versioned JSON/source export and bounded import without secrets or executable install hooks. Complete dental clinic booking example. Full mocked Playwright journey; accessibility and adversarial security review; clean-install verification and accurate release notes. Gate: all 14 user acceptance criteria, with any unverified live-provider behavior disclosed.

## Risks and decisions

- **AI authentication:** SDK documentation restricts third-party Claude account login. Use personal Anthropic API keys in V0; do not reuse local Claude OAuth tokens. Running an unmodified CLI is a distinct integration with different conditions and is deferred pending use-case clarification.
- **Untrusted execution:** iframe isolation is necessary but does not itself stop outbound navigation or resource exhaustion. Separate runtime origin, CSP, validated messages, backend origin checks, compilation limits and adversarial tests are a release gate. Browser/OS bugs and local malware remain out of scope.
- **Filesystem safety:** canonical containment must cover symlinks, Windows drive/UNC paths, reserved names and import archives. Model output is data; only backend-owned write operations can mutate approved source paths.
- **Durability:** SQLite transactions do not include file writes. Stage files, use atomic promotion with a recoverable journal, and preserve immutable snapshots before destructive changes.
- **Dependency drift:** exact versions plus lockfile; no arbitrary generated dependencies. Check actual peer constraints and test on the pinned Node LTS line.
- **Secrets:** OS credential storage is preferred for a future saved-key option. Initially support a process-held key or backend environment variable rather than claiming plaintext disk storage is secure.
- **Scope:** Phase 1 is an engineering foundation, not a usable V0. Stop after its validation and report remaining work.
