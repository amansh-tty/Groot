# Current state

- **Current milestone:** GROOT-001 Portable Prototype Artifact complete.
- **Completed:** Shared preview/export compiler; `pnpm groot export <id> [--example]`; standalone HTML; embedded imported images; external-directory HTTP and file:// portability proof. Emergency Booking artifact: 754,330 bytes, seven screens and six states, zero Groot API/dependency requests. Passed: 27 unit tests, three existing Playwright workflows, production restart smoke, typecheck, lint, build. See docs/architecture/portable-artifacts.md for exact artifact paths and evidence.
- **In progress:** None. Groot dev server was stopped for portability validation.
- **Next:** Await approval for the next checkpoint. No hosted publishing work started.
- **Known blockers:** None for GROOT-001. Only imported local images are supported; remote/dynamic assets, fonts and APIs remain unsupported. Artifact execution still requires an appropriate sandbox in a future hosted viewer.
- **Important files:** apps/server/src/prototype-compiler.ts, prototype-export.ts, prototype-export.test.ts, workbench.ts; scripts/groot.mjs, scripts/export-smoke.mjs. Local preview caching remains in Workbench. Export defaults to workspace/; --example explicitly selects NOVA. Changes are uncommitted.
