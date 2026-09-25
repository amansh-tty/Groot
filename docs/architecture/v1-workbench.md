# V1 workbench implementation

The source repository is the authority. Fastify discovers demos by walking demos/*/meta.json; Zod validates metadata. It reads known context Markdown and feedback JSON. SQLite remains unchanged for appearance settings only.

Node recursive filesystem watchers observe demos, context, data, design-system and local identity. They increment a revision; the browser polls metadata every 1.2 seconds and recompiles the open demo only on a changed revision or explicit refresh. Builds are cached by demo/revision. A failed compile returns diagnostics; the UI keeps the previous iframe URL. This is automatic full-preview reload, not React state-preserving HMR. Vite still provides HMR for workbench development.

The esbuild entry imports the demo's default component and optional config. It never evaluates those modules on the backend. Bundling resolves React/Lucide from the installed workbench and restricts loaded files to the active demo, shared data/components and installed dependencies. Compilation output stays in memory. Runtime configuration executes only in the iframe, then sends declared screen/state metadata to the parent. Parent messages are accepted only from the matching frame; preview selection messages only from its parent.

The HTML preview endpoint sets a per-build script nonce, denies network connections/forms/child frames, and applies sandbox allow-scripts both as a header and iframe attribute. No allow-same-origin is granted. Administration endpoints retain Host/Origin/JSON checks and reject null origins. This is browser isolation for locally reviewed source, not a hardened arbitrary-code hosting service: self-navigation and resource exhaustion remain limitations.

Create alternative validates and bounds the source tree, copies to a hidden staging folder, updates metadata and resets inherited feedback, then renames to a unique folder. Existing source is never overwritten. Shared components/data intentionally remain shared; editable demo source stays independent. There are no immutable snapshots or automatic merges.

Production serves the built web app, but reads and recompiles repository demo source just as development does. Tests supply an isolated workspace root; compiler dependencies remain resolved from the application installation.
