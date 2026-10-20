# Toolcraft visual-language worklog

Active change: playground-workbench-rethink-2026-10-20

## Decision trail

The user rejected the incremental Playground makeover and explicitly requested a fresh interface based on the concept and Toolcraft's visual language. The actual Toolcraft starter UI and public UI/style contract were inspected. Playground remains its existing React/TypeScript/pnpm local workbench; it is not a generated Toolcraft canvas product. No copied Toolcraft runtime or private control implementation was edited, no custom renderer was introduced, and no unrelated timeline/layer/export behavior was added.

The product entities are the project library, exploration direction, preview viewport/scenario, designer feedback, explicit design controls and source evidence. Their interaction owners are respectively the project library, session strip/alternative dialog, floating preview dock/scenario strip, Review, Controls (only if declared), and Details/Start Here. These are workbench file operations and browser previews rather than Toolcraft runtime schema controls; there is no duplicate canvas-value editor. The tested compiler, opaque sandbox, JSON persistence, parent relationships and project separation remain intact. One additional read-only workspace response field identifies the correct agent repository folder separately from the content root.

This is substantial later work on the existing app, covered by the current-run audit, focused implementation plan and outcome-based workflow tests. No Toolcraft-generated product delivery/performance receipt is claimed. No benchmark or optional product export was authorized. See ../redesign/plan.md and ../redesign/report.md for the source capture, rejected dashboard structure, changes, verification and inherited NOVA risks.

## Cleaner workspace experiment

Latest user request: re-derive from the brief, with a cleaner modern feel. See docs/refinement/plan.md. Removed the library side panel and repeated navigation links, grouped search/filter controls in one row, increased type and spacing, and adopted light neutral surfaces. Existing preview/feedback/alternative controllers remain canonical. This translates Toolcraft principles; it does not claim to run its renderer framework. No imported sources or NOVA files changed.

## Approved Groot build

User approved home, editor and centered dialog image studies. Implemented file tabs, home destination sidebar, variation sidebar, vertical tools, default-open Controls/Preview/Comments inspector, named screen arrows, external-agent screen/state handoff and optional read-only file-backed prompt history. Shell uses grayscale only; actual imported previews keep source colors. No runtime internals or dependencies changed. Plan and verification: docs/groot/implementation-plan.md and design-qa.md. User source assets are reused as live iframe previews; generated mockup content is not substituted into prototypes.
