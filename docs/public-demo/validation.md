# Public demo and context validation

- `pnpm check`: lint, typecheck, 40 tests across 12 files, local production build passed.
- `pnpm test:e2e`: all eight browser tests passed, covering discovery, external edits, failed-build recovery, independent alternatives, feedback persistence, responsive shell and project isolation.
- `pnpm test:public`: default Spend.In preview, opaque sandbox, setup modal, Home, isolated NOVA example, downloadable setup skill and zero backend API requests passed against a static-only server.
- `pnpm test:mcp`: fresh temporary project creation, repeatable setup, exact generated server command, real stdio MCP connection, saved answers and scenario brief passed.
- `pnpm format:check`: passed.
- New context tests cover provenance, stale-write rejection, malformed-file preservation, symlink refusal, configurable followups/cycle refusal, project isolation and an actual MCP client/server protocol roundtrip.

The public capture is `demo.png`. Prototype source content remains unchanged. Local configuration is prepared, not silently installed into arbitrary third-party agent clients. Their trust, enablement or restart step remains explicit; the setup skill must verify a real tool call before reporting completion.
