# Phase 1 validation record

Date: 2026-09-23. Environment: Windows, Node 24.19.0, pnpm 11.19.0, Chromium 153 via Playwright 1.63.0.

## Implemented and exercised

- Six-workspace pnpm monorepo (root plus two apps and three packages), strict TypeScript, ESLint, Prettier, Vitest and Playwright.
- React/Vite dark application shell, local environment status, navigable build progress, responsive appearance editor, source-owned shadcn/ui button, Lucide icons and Zustand state.
- Fastify API with Zod payload/response contracts, trusted-host/origin restrictions, JSON-only mutations, bounded bodies and sanitized errors.
- SQLite settings persistence, WAL, transactional migration history, restart recovery and refusal of unsupported future schema histories.
- Production static serving from the web build only. Runtime data is not served. Node-only production launch; Vite development launch with API proxy.
- Provider-neutral TypeScript contract and runtime policy constants. Neither is a live AI integration or executable prototype sandbox.
- Architecture, product, authentication/dependency research, decisions, contribution/setup guidance, four focused skills and fictional dental-clinic fixture data.

## Executed checks

- `pnpm install --frozen-lockfile`: passed with the final workspace configuration.
- `pnpm format:check`: passed after formatting the final sources.
- `pnpm lint`: passed with zero warnings.
- `pnpm typecheck`: passed.
- `pnpm test`: **18 tests passed across 3 files**. Covers real SQLite reopen, migrations, invalid/unknown settings, future-schema refusal, request origin/host/content restrictions, absent planned routes, frontend connection failure and rollback after a failed save.
- `pnpm build`: all packages and apps built successfully.
- `pnpm test:e2e`: **3 Chromium tests passed** against the compiled app. Exercises actual UI/API/SQLite appearance changes and reload persistence, accurate phase scope, network failure/retry, mobile layout, skip link and keyboard radio selection. No page errors in the main workflow.
- `pnpm test:smoke`: passed against real HTTP and two successive server processes using the same temporary database. Confirms built HTML delivery, saved setting survival across restart and `.env` denial.
- `pnpm dev`: both Vite and Fastify started successfully after correcting tsx watch-argument order. The in-app browser rendered the app and reported the real local server and SQLite connection.
- Desktop overview/appearance and 390px mobile appearance screenshots were inspected. No clipping/overlap observed; the mobile test also checks document overflow. This is a basic accessibility check, not a full WCAG audit or screen-reader certification.

The first browser run caught delayed controlled-radio selection. Selection now updates immediately, while a failed write restores the previous setting and exposes the error; the rerun passed. Initial sandbox `spawn EPERM` failures were runner restrictions and were resolved by allowing child-process execution. Tests never contacted an AI provider.

The bundled skill validator was attempted but could not run because its Python environment lacks PyYAML. The four short skill files were reviewed manually for valid name/description frontmatter and the requested purpose, inputs, procedure, outputs, constraints and example sections. No validator pass is claimed.

## Basic security review

Verified loopback binding, exact Host/Origin acceptance, rejection of `null` and foreign browser origins, no broad CORS, strict settings schemas, no raw input in error responses, no credential fields, no exposed data directory and no generated-code execution. Production sets CSP, no-sniff, no-store and frame-denial headers. Local software with direct access to the OS can still read user data; this is not application authentication or an OS isolation boundary.

The prototype sandbox remains an unvalidated design. Filesystem containment for model writes, malicious imports, egress control, runtime resource exhaustion and postMessage isolation must be implemented/tested in Phase 4 before executing model output.

## Explicitly incomplete

Onboarding, AI configuration and verification, project creation/context editing, project workspace/chat, streamed generation/cancellation, compilation/preview, version snapshots, import/export and the functional dental example are not implemented. The full V0 acceptance criteria are not met. No real credential or paid request was tested; no subscription-backed Claude connector is offered. macOS/Linux installations remain unverified.

## Next gate

Phase 2: persist resumable onboarding; implement personal Anthropic API-key configuration/real minimal verification behind the provider interface; create projects and optional structured context. Add mocked connection/auth/network tests, project creation/context/reopening tests and onboarding completion coverage before proceeding to Phase 3.
