# V2 validation

Validated on Windows with Node 24.19 and the existing pnpm toolchain, 24 September 2026. No new dependencies or provider integration.

- V2.1: targeted storage tests and browser comment creation/edit/resolve/reopen passed before alternatives began. A real local comment was read by Codex, the confirmation CTA was adjusted, and the live preview updated. The comment stays open for designer acceptance.
- V2.2: independent alternative creation, parent/rationale persistence, and both booking flows in side-by-side comparison passed before controls began.
- V2.3: keyboard gap 16 → 24, immediate preview, explicit file save, undo, reload persistence, external-edit conflict recovery and unsaved-navigation protection are covered by the iteration browser test.
- Final unit run: 24 tests passed across five files. Production smoke passed: real HTTP and process restart preserve an alternative and appearance settings.
- Final typecheck, lint and production build passed. Both V1 and V2 Playwright workflows passed after the navigation/layout fixes, including narrow-screen inspector collapse.
- Manual browser checks: local comment → repository → source edit → live preview; confirmation interaction in both comparison frames; gap 16 → 24 saved and read from controls.json, then undone to 16. Desktop and 760px panel screenshots inspected.

Important boundaries: comparison states are independent; controls support only declared numeric/slider values in one NOVA area. Undo is session-local and resets when leaving the viewer or entering comparison. Preview form state resets after a source/config compilation. Stable element IDs are preferred; fallback selectors may become stale. Optimistic revision checks protect against known conflicting edits, not malicious filesystem races or arbitrary hostile prototype code.

The optional generic UI audit is retained in premium-audit.json, not reported as a passing check. It flags existing design-system example buttons, prop-forwarding primitives, the handled home hash link and textarea styling it cannot recognize. No audit-driven V1 redesign was performed. The standalone DESIGN.md package linter was not installed or run.

Changed areas: shared contracts; backend feedback/control file operations and browser bridge; viewer feedback/controls/comparison/tree; NOVA stable targets, CTA and Urgency First; three relevant skills and concise usage documentation. The runtime remains local files plus the existing appearance database.
