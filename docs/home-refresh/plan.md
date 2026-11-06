# Home and project organization

Approved scope: Home, project organization, multiple project file types, related prototypes and a compact factual work summary. Integrations, timers, canvas authoring, slide generation, agent execution and calendar management are deferred.

Preserve: grayscale shell tokens; imported prototypes and their design systems; file discovery; independent variations; sandbox, feedback and controls; public/local separation; keyboard and responsive behavior. Root NOVA content is read-only for this addition.

Implement a file-based collection of design-source links, planning documents, presentation links/notes and general notes. Each file is one validated JSON document under project-files/, with explicit related prototype IDs. Existing context Markdown remains in place and is surfaced read-only. No arbitrary remote content is fetched, and no editor/import fidelity is implied by a link. Public builds publish no visitor-created project files.

Home uses a project heading and restrained count summary, a file-type browser with search and document details, and preview-led exploration cards grouped by their original/alternative relationships. Reuse Button, Dialog and native fields. Creation is exclusive and preserves existing data. Show loading, empty, no-results, malformed-file warnings and save errors without clearing drafts.

Reference direction: Figma recents file-type navigation (Mobbin fb25258c-2581-4c4c-a59f-da737bb4f8a8) and Jitter preview-led files (89cfc7d6-ef33-4997-94a0-e598e9c1fd5f). Existing user image supplies the monochrome visual direction. Paper's earlier attached toolbar is relevant to the retained editor; no uninspected current Paper UI is claimed.

Validation: bounded path/schema and project isolation tests; create/open/filter/related-prototype browser workflow; existing discovery/live-update/recovery/feedback tests; public static smoke; typecheck, lint, format and builds. Capture Home before/after at the same viewport.
