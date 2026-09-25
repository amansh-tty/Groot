# Playground

A local-first visual workbench for product designers. **Your existing coding agent edits the repository. Playground discovers, renders and organizes that work.** No provider connection, API key, chat or account.

## Run locally

Use Node **24.19+ on the 24.x line** and pnpm **11.19.0**.

```sh
npm install -g pnpm@11.19.0
pnpm install --frozen-lockfile
pnpm dev
```

Open **http://127.0.0.1:5173**. The repository root is this directory; in the supplied Groot workspace, first run `cd playground`. Four fictional NOVA DENTAL demos are already populated. No onboarding or import step.

For the compiled application:

```sh
pnpm build
pnpm start
```

Open **http://127.0.0.1:4310**. Both modes watch the same local files and compile previews when they change. No Docker or cloud service is required. Installation needs network access; the workbench runs offline afterward.

## Use your own coding agent

Open **this same folder** in Codex, Claude Code, Cursor, Warp or VS Code. Keep Playground running. Ask the agent to read `AGENTS.md`, relevant `context/*.md`, `packages/design-system/src`, and the applicable `skills/*/SKILL.md`.

For example:

> Read NOVA context and the design system. Modify demos/emergency-booking-simplified/src/App.tsx to make urgency easier to scan. Preserve the other explorations.

Save the file. The watcher invalidates the preview, which refreshes automatically after a successful compile (normally within a few seconds). A syntax error displays diagnostics and retains the previous compiled preview. Form state resets when the preview reloads.

Use **Create alternative** before independent explorations. It copies the complete demo folder, records `parentId`, assigns your local author, and opens the new exploration. Edit that folder; the original source is unchanged. Alternatives are working copies, not immutable version snapshots.

## Iterate in V2

- Open Simplified Booking. Choose a screen, enable **Comment**, then click an eligible element or focus it and press Enter. Save feedback in the inspector. Escape exits comment mode. Open markers are visible only in comment mode; the panel filters All / Open / Resolved.
- Ask your external agent: “Read the open feedback for Emergency Booking Simplified and address the CTA feedback. Respect the NOVA design system.” It reads the normal feedback JSON array. Resolution remains the designer's decision.
- **Create alternative** preserves original source and feedback. Supply a name, description and optional rationale; the copied exploration starts with empty feedback. The relationship tree identifies the base and active alternative.
- **Compare** opens two independent interactive previews. Choose Simplified and Urgency First; each has its own screen/state and scroll position. On narrow screens the panes stack.
- On Simplified, open **Controls**, then **Show appointment slots**. Adjust gap, padding, radius, title size or duration using mouse or keyboard. **Save changes** writes controls.json; **Discard preview** cancels unsaved tweaks; **Undo last change** writes the previous saved values. No React source rewriting occurs. Controls are intentionally limited to this one area and copied alternatives.
- Invalid or externally changed feedback/control files produce a visible error instead of silent replacement. Reload file values to reconcile. Avoid concurrent external writes during an app save; revision checks are optimistic, not filesystem locks.

## Files are the product model

- `demos/<id>/meta.json`: ID (matching folder), title, description, platform (`web` / `mobile`), author, optional authorSlug, tags, parentId and designer-owned rationale.
- `demos/<id>/src/App.tsx`: default-exported React component receiving optional selected screen/state values.
- `demos/<id>/prototype.config.ts`: optional default export with `screens`, `states` (each an array of `{id,label}`) and `viewport`.
- `demos/<id>/README.md`: temporary assumptions, potential learnings and optional external-agent test prompts.
- `demos/<id>/feedback/feedback.json`: readable structured feedback. Element comments are created, edited, resolved, reopened and deleted in the viewer.
- `demos/<id>/controls.json`: optional declared numeric controls and persisted values, imported by prototype.config.ts and explicitly bound in source.
- `context/`: established product information, users, principles, constraints, terminology and decisions.
- `data/`: shared fictional patient/provider/operatory/appointment JSON and scheduling logic.
- `packages/design-system/src/`: real NOVA tokens and components, used by all demos and the Design System page.
- `.console/config.json`: local designer name and slug. My Demos compares this slug with `authorSlug`.

To create a demo without the UI, copy an existing demo folder to a new lowercase-hyphenated ID, update its `meta.json` ID/title/parentId, and edit its independent `src/App.tsx`. Discovery is automatic. Shared imports are limited to the demo itself, shared data, design-system files and installed browser dependencies. No package installation occurs during preview compilation.

## What works

All Demos gallery with search, platform filters and grid/list layouts; My Demos; Start Here and readable product context; live design-system reference; independent alternatives; isolated interactive previews; desktop/mobile viewports; declared screens/states; refresh, compilation/runtime errors; element feedback, experience comparison, controlled slot-card adjustments and readable assumptions.

NOVA DENTAL is fictional. Current Booking uses seven stages, Simplified uses three, Urgency First uses four stages with recommended provider/room pairs, and Patient Search supports recent/search/result/error scenarios. All booking flows check full-duration provider and operatory availability against shared fixtures before offering slots. Confirmations are simulated local prototype state, never real appointments.

## Validation

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
pnpm test:smoke
pnpm format:check
```

The critical Playwright flow edits a **temporary workspace**, proves automatic preview updates, checks failed-build recovery and original/alternative independence, and exercises real demo interactions. The restart smoke test reopens an alternative after restarting the server. No test invokes an AI. See [V2 validation](docs/v2-validation.md) and historical [V1 validation](docs/v1-validation.md).

## Boundaries and limitations

Prototypes run in a sandboxed iframe with an opaque origin and restrictive CSP. The backend never evaluates prototype modules or grants shell access; esbuild only bundles them for the browser. Browser isolation is not a complete hostile-code/OS sandbox: review local source before running it. Resource exhaustion, browser defects and iframe self-navigation remain limitations. Do not expose the loopback server publicly or use real patient data.

Only appearance preferences use SQLite outside the repository. Defaults: Windows `%LOCALAPPDATA%/Playground`, macOS `~/Library/Application Support/Playground`, Linux `${XDG_DATA_HOME:-~/.local/share}/playground`. Optional `.env` overrides `PLAYGROUND_DATA_DIR` (absolute path) and `PLAYGROUND_PORT`. The running repository supplies the demos by default. `PLAYGROUND_WORKSPACE_ROOT` is an optional absolute test/workspace root with the documented folders, not a general folder-picker/import feature.

Source, context, alternatives and feedback survive restart as normal files. In-progress prototype form state does not. The gallery uses schematic thumbnails, not automatically captured screenshots. Only explicitly declared numeric/slider controls are editable; immutable snapshots, remote integrations and arbitrary no-code editing remain deferred. Comparison states are independent. Feedback selectors can become stale after source edits; stable data-playground-id attributes are preferred.

The unused `packages/ai` contract and earlier V0 planning/research are historical and deferred. They are not part of the current runtime. [V1 product definition](docs/product/v1.md) supersedes those plans.

## Troubleshooting

- **Node/pnpm mismatch:** use the versions above; engine checking reports unsupported versions.
- **Cannot read or create an alternative:** check permissions on `demos/` and keep its content inside the repository. Symlinks and unsupported file types are rejected by the fork operation.
- **Port in use:** stop the other Playground instance or change `PLAYGROUND_PORT` in `.env`. Vite uses 5173.
- **Compile error:** check the shown file/line, the default React export and import paths. Save the correction to retry.
- **No demos:** check `meta.json` syntax and that its ID matches the directory name. Invalid entries appear as gallery warnings.
- **Browser test executable missing:** install Chromium with the command above.
- **Restricted runner reports spawn EPERM:** the compiler, browser and dev tooling need ordinary child-process execution permissions.

MIT licensed. See [CONTRIBUTING.md](CONTRIBUTING.md) and [third-party notices](THIRD_PARTY_NOTICES.md).
