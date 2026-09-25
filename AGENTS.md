# Repository guidance

Playground V1 is a visual workbench around the user's existing coding agent. The repository is the integration layer. Read `docs/product/v1.md`; the previous V0 provider/phase plan is superseded.

- Use TypeScript, pnpm and the existing small packages. Keep UI primitives in `apps/web` until reuse justifies extracting them.
- Do not implement providers, API keys, embedded chat, accounts or autonomous agents. External agents edit normal local files directly.
- Before creating UI: inspect `packages/design-system/src`, search for an existing component, reuse it, respect tokens, and add a component only for a real gap.
- Discover demos through `demos/<id>/meta.json`; source lives in `src/App.tsx`, optional declared screens/states in `prototype.config.ts`. Never register demos in SQLite.
- Read only relevant files in `context/`. Established context stays separate from each demo's README assumptions/learnings and `feedback/feedback.json`.
- Use `skills/onboarding`, `design-system`, `prototype`, `prototype-review`, `feedback` and `fork-prototype` when applicable. These files are explicit repository guidance; agent-specific automatic skill discovery is not assumed.
- Preview code runs in an opaque iframe with a restricted network policy. Do not add backend calls, Node modules, package installs or shell tools to demos. Review local code before running it; browser isolation is not an OS sandbox.
- Only backend-owned operations may write validated paths inside the active project's canonical workspace. Cover symlinks and Windows path variants. Confirm destructive operations; never discard a working prototype to promote a failed candidate.
- Separate facts, decisions, assumptions and proposals. Use relevant bounded context rather than sending every file.
- Append transactional database migrations; never mutate released migrations or silently downgrade a database.
- Preserve keyboard focus, labels, reduced motion, contrast and responsive layout. Use the shared tokens and 4/8px spacing.
- Run targeted tests, typecheck, lint and build for meaningful changes. The critical Playwright test proves external editing/hot reload and independent alternatives. Use isolated test workspaces; never edit a user's demo in a test.
- Preserve original demos when exploring alternatives. Copy the complete demo directory, assign a unique ID matching its directory, set parentId and local author metadata. Keep imports to shared design-system/data modules, not sibling demo source.
- Do not alter `.git`, dependencies, application infrastructure or established product facts to satisfy a prototype-only task. Keep application and demo changes scoped; document actual validation.

The unused `packages/ai` contract and historical V0 documents are deferred, not part of V1. SQLite remains only for appearance preferences. Watchers detect local edits; preview updates after successful compilation and retains the previous build on failure. See README for source paths and running commands.

V2 feedback stays in the existing JSON array at `demos/<id>/feedback/feedback.json`. Prefer stable `data-playground-id` attributes and `data-playground-screen` on the current screen container. Read `skills/feedback/SKILL.md`; never auto-resolve feedback without designer instruction.

V2 controls are opt-in `controls.json` definitions/values imported by `prototype.config.ts` and bound explicitly through the prototype controls prop. Read the saved values before editing; do not hardcode over designer adjustments. `meta.json` rationale belongs to the designer. Preserve it when implementing feedback and use supplied rationale when creating alternatives. See README for Comment / Compare / Controls workflows.
