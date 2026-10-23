# Public demo and local project context

Keep the existing React/TypeScript/pnpm app. Public mode is a static build of an explicit bundled demo allowlist, precompiled sandbox frames and sanitized metadata; it has no filesystem/backend access and cannot persist shared mutations. Open Spend.In by default; preserve Home, exploration navigation, example isolation and the established monochrome design. A clear Use my own project action opens the shared modal with agent-led installation steps and a copyable setup brief.

Local mode keeps existing workflows. Add an official-SDK stdio MCP bound to one explicit workspace. It reads configurable context questions, saves sourced facts/decisions/assumptions with revision checks in context/PROJECT.json, reports missing answers and returns prototype-specific briefs cross-referenced with bounded Markdown context. No embedded agent, provider, account or arbitrary filesystem tool.

Add a repository setup skill and per-project install artifacts. Setup checks runtime/build, creates a thin project without replacing existing content, supplies the project-specific MCP command/config and an agent skill requiring a context brief before each new prototype. Existing projects use their own context and design system; imported demos/NOVA stay unchanged.

Validate read-only static serving without an API, setup paths/idempotency, MCP client round trips, configurable questions, revision conflicts, malformed files and project isolation; run existing checks and relevant browser tests. Deploy the static output through Sites, make it public as explicitly requested and verify the actual returned URL/status.
