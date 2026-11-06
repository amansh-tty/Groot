# Project files

Start Here → Project files organizes sources, plans, presentation documents, notes and read-only context. Global Home lists projects; each project keeps its own runnable explorations in Overview. The project remains the filesystem root; adding a file does not create or switch projects.

New file supports design sources (original http/https URL required), plans, presentation links/notes and general notes. Each document is stored independently as `project-files/<id>.json` inside the active workspace, with title, kind, description, URL, body, relatedDemoIds, ID and creation time. UI creation generates a unique ID, uses exclusive file creation, and never replaces an existing file. References must point to explorations in the active project. Source URLs containing credentials or non-http(s) protocols are rejected; the backend never fetches a source URL.

Edit the JSON using the external coding agent. Preserve its ID and filename. Body is plain text/Markdown shown as text, without executable HTML. The file list and open document refresh on a four-second local polling interval. Invalid files are surfaced as warnings and preserved; links, oversized files and invalid metadata are refused. Up to 200 project entries and 32 KB per JSON document are supported. The file browser loads twelve items at a time with explicit Load more, search and type filters.

Existing context Markdown is surfaced without moving or rewriting it. Context files open read-only. Explicit document-to-exploration relationships appear in the file detail view; unavailable externally removed relationships are labeled as unavailable. Prototype lineage remains its existing parentId contract.

The NOVA example remains read-only for project-file creation. Public builds export only their preselected bundled prototypes/context and an empty project-file collection; they do not publish locally created project files. New file in public mode opens the local setup guide. No new GitHub, calendar, agent-execution, todo or presentation-generation connection is implied. The MCP's existing brief still reads its established structured context and Markdown sources; project-file links are organization, not automatic remote ingestion or bidirectional synchronization.

References are links, not imported editable design files. Plans are documents, not a whiteboard. Presentations are links or notes, not generated slide decks. Imported prototype source and design systems are unaffected.
