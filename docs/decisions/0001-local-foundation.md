# 0001 — Local Node/SQLite foundation

Date: 2026-09-23. Status: accepted for Phase 1.

Use pnpm workspaces, Node 24 LTS, Fastify and built-in SQLite. Serve the compiled React app and API on one loopback origin. Use Vite's API proxy during development. Place the database outside the source repository by default.

This gives a single local runtime with no Docker, service database or native SQLite npm installation. Small synchronous SQLite operations are acceptable for a single designer; compile/model work must not run synchronously on the request loop. Pin the tested runtime line because Node's SQLite API maturity and behavior vary across versions.

Only create settings tables now. Phase-specific project/prototype tables and source layout arrive with their consumers. Credentials never belong in portable project metadata.
