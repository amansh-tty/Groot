# V1 core-loop validation

2026-09-24 · Windows · Node 24.19.0 · pnpm 11.19.0 · Playwright Chromium.

## Course correction

Kept the monorepo, React/Vite/Fastify, dark tokens, SQLite appearance settings and existing tooling/tests. Replaced the foundation-only UI with the filesystem workbench. Removed the unused server dependency on the AI package; retained its old contract as a deferred artifact. No provider, chat, key onboarding, account or agent proxy was implemented.

## What works

- Automatic discovery from demo directories, metadata validation and invalid-entry warnings.
- All Demos search/platform filtering/grid/list; My Demos based on local authorSlug.
- Start Here with readable product context and explicit external-agent instructions.
- Reusable NOVA tokens and components, rendered in a live design-system reference.
- Current Booking (seven stages), Simplified Booking (three stages) and Patient Search with shared fictional data.
- Compatible full-duration provider/room availability, required patient/reason selection and simulated confirmation.
- Interactive isolated previews, viewport switches, declared screen/state navigation, refresh, compile/runtime diagnostics and retained previous preview on compilation failure.
- Independent alternative folders with lineage/local author metadata; originals remain intact.
- Automatic refresh after an external file write, including recovery after a syntax error.
- Read-only sample feedback and per-demo assumptions; normal file persistence across process restart.

## Executed validation

- Typecheck, lint and production build passed.
- The retained suite plus new filesystem tests passed: 21 tests across four files.
- After the final revision/preview adjustments, targeted filesystem/compiler and scheduling tests passed: four tests across two files (22 distinct unit/integration tests in total).
- One critical Playwright workflow passed. It exercises gallery filtering, context, the design-system viewer, both complete booking flows, an error state, alternative creation, external source editing, compile failure/recovery, original independence, reload, My Demos and patient search/no-results/selection.
- The external edit is a real Node filesystem write in a temporary workspace. The test changes the alternative's heading and observes the new heading inside the iframe without a manual refresh. It then writes invalid syntax, observes diagnostics and the preserved preview, restores valid source, and returns to the unchanged original.
- The production smoke test passed: a newly forked demo and the saved preference remain after the server is stopped and a new process opens the same workspace.
- Development servers launched successfully on loopback ports 5173/4310. Desktop gallery and prototype screenshots were visually inspected.

The initial browser-test failure was a test selector matching All Demos navigation instead of the ALL platform filter. It was corrected; no failure was hidden. An automatic execution-approval timeout was retried successfully. No external AI or paid request was used.

## Files created or modified

- `apps/server/src/workbench.ts`, `workbench.test.ts`, `scheduling.test.ts`: discovery, watching, compilation, alternatives and targeted tests.
- `apps/server/src/app.ts`, `index.ts`, package manifest: workbench routes and configured source root; retained settings API.
- `apps/web/src/WorkbenchApp.tsx`, `PrototypeView.tsx`, `DesignSystem.tsx`, `workbench-api.ts`, `workbench.css`, `main.tsx`: gallery, preview, inspector, reference areas and visual shell. The unused Phase 1 App/styles were removed after checking references.
- `packages/design-system/`: reusable NOVA components/tokens. `packages/shared/src/index.ts`: metadata, local identity, feedback and preview contracts.
- `context/*.md`, `data/*.json`, `data/scheduling.ts`, `.console/config.json`: established product context, fictional records, availability logic and simple local identity.
- `demos/emergency-booking/`, `demos/emergency-booking-simplified/`, `demos/patient-search/`: independent functional source, metadata, declared states, README assumptions and feedback files.
- `skills/onboarding/`, `prototype/`, `feedback/`, `fork-prototype/`: new focused external-agent guidance; design-system/review skills updated. Old provider-generation guidance marked historical.
- `AGENTS.md`, `CLAUDE.md`, `README.md`, `CONTRIBUTING.md`, `docs/product/v1.md`, `docs/architecture/v1-workbench.md`: current architecture and setup. Supersession notices added to directly conflicting V0 documents.
- Workspace manifests/lockfile, TypeScript inclusion, Playwright configuration and `scripts/production-smoke.mjs`: source-aware validation and isolated test workspaces.

## Deliberately incomplete

Designer property controls, feedback capture/editing, automatic thumbnails, immutable version history, arbitrary folder importing and universal React editing are not implemented. Thumbnails are schematic. Prototype input/confirmation state resets on refresh; source and alternatives persist. Runtime failures are reported, but only compilation failure preserves the previous iframe automatically.

The preview is for locally reviewed source. It is not a hardened arbitrary-code hosting service; resource exhaustion, iframe self-navigation and browser defects remain limitations. macOS/Linux and real third-party editor sessions were not exercised. The filesystem edit contract used by those editors was exercised end to end. Skill content was manually reviewed; no Python validator pass is claimed.

## Next recommended feature

A small declared property-controls experiment that writes one prototype configuration file, with an external-agent round trip. Keep feedback editing and universal AST editing outside that experiment.
