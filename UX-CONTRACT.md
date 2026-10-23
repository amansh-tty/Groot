# Groot interaction contract

The maintained user brief and AGENTS.md own product behavior. DESIGN.md owns the Groot interface. Imported prototype data and design systems remain independent.

Variation titles wrap rather than truncate. PromptExcerpt uses a two-line excerpt and an explicitly invoked native popover for long text; the full text is scrollable, viewport-bounded and dismissible with Escape, outside click or its labeled close button. Placement follows the invoking variation or history entry. The excerpt labels recorded prompts separately from fallback direction descriptions. Compare shows the current flow first and requires an explicit different target, grouping related variations before other explorations. Both panes still run independently.

| Capability     | Canonical owner                                        | Source of truth                              | Allowed variants                                      | Verification                        |
| -------------- | ------------------------------------------------------ | -------------------------------------------- | ----------------------------------------------------- | ----------------------------------- |
| Select/Listbox | Native labeled select                                  | DESIGN.md / existing prototype configuration | OS popup                                              | browser workflow tests              |
| Form           | Shared Button / Dialog / FeedbackPanel / ControlsPanel | shared Zod schemas and revision hashes       | inline review, modal alternative, modal agent handoff | first-use and iteration tests       |
| Scrollbar      | studio.css global tokens                               | DESIGN.md                                    | independent inspector and frame scrollers             | browser screenshots                 |
| CRUD           | Workbench validated file operations                    | JSON files and revisions                     | feedback / controls / independent alternatives        | workbench.test.ts and browser tests |

## Navigation and discovery

Explorations, My Explorations, Design System and Start Here remain directly available in one global navigation bar. Top-level destinations persist in the hash page parameter; active explorations use the demo parameter. Back/forward respect dirty control drafts. The user workspace is primary. NOVA is explicitly separated by its example URL and a library return link. Existing original exploration deep links retain their explicit example redirect.

Metadata discovery remains file-based. The library offers immediate local search, a clear button returning focus to the field, platform filters, explicit recent/name sorting, grid/list and twelve items before Load more. Search/filter/page changes reset the displayed limit. Filtering is transient session state; the architecture deliberately does not require URL query persistence. Thumbnail frames are inert, opaque and lazily loaded. Compilation errors preserve their last working frame.

Design System opens the actual original exploration tagged design-system; absent libraries receive contextual optional guidance. Start Here discovers valid top-level project context Markdown files and keeps facts/source notes separate from prototype README assumptions. It provides a copyable folder path and contextual external-agent prompt, with selectable fallback text when clipboard access fails. No account, provider or embedded agent is introduced.

## Prototype workspace

Opening an exploration removes the library panel. One session strip owns title, direction choice, live status, alternative creation, comparison and tools disclosure. The floating dock owns viewport, fit, reload and Interact/Comment mode. Scenario choices come only from prototype.config.ts and remain visible outside the inspector.

Desktop Fit uses a 1440x1024 iframe and fits both available width and height. Mobile uses 390x844. Actual size returns to responsive unscaled desktop. These geometry changes preserve iframe identity and prototype state. Browser frames retain allow-scripts only, opaque origin and restricted networking; no server API or dependency installation is exposed to prototype code.

## Review and tools

The optional inspector displays Review, Controls (only when declared) or Details. Review contains feedback and the composer. Details contains provenance, lineage, source files, rationale and assumptions; it is not mixed into the feedback task. Controls uses the existing explicit contract and does not rewrite arbitrary source. Dirty controls prevent navigation, tool changes that would hide the draft, refresh and comparison; the recovery reason stays visible.

Feedback create/edit preserves drafts on errors and uses optimistic file revision checks. Delete has a named inline confirmation with Keep comment focused. Resolve/reopen are explicit designer actions; external source edits never resolve comments. Comments prefer stable data-playground-id and data-playground-screen attributes. Stale selectors are explained instead of silently remapped. Feedback remains the existing readable JSON array.

Controls preview immediately. Save writes controls.json; Discard restores loaded values; Undo restores the previous saved values within the mounted session. External revision conflicts require reloading file values and never silently overwrite newer data. Unsaved controls use the narrow beforeunload guard on actual page unload. Numeric sliders retain native keyboard operation.

## Alternatives and comparison

Create alternative opens the shared app-owned modal. Name validation focuses the invalid field. Submission is exclusive/busy, its error stays in the form rather than masquerading as a compiler failure, and pending creation cannot be dismissed. Success opens the new direction. The backend copies the entire exploration, assigns a unique matching folder/metadata ID, parentId and local authorship, starts with empty feedback, and preserves the original. Rationale is designer-supplied.

Comparison first chooses the active direction plus its parent or an existing child. If no related alternative exists, the second pane is empty with an explicit direction chooser; it does not silently compare unrelated design-system content. Either pane can select any exploration in the same project. Screens, states, runtime state and scrolling remain independent. Each preview is fit to its own pane; comparison source is unchanged. At narrow widths panes stack.

## Dialogs, focus and recovery

Shared Dialog owns an accessible heading, native modal background isolation, explicit Tab/Shift+Tab cycling, Escape and return focus. It never uses alert(), prompt() or confirm(). Project creation remains a validated inline form preserving entered values on failure and using exclusive file creation. No existing project is overwritten. No global orientation banner consumes prototype space; help is available in Start Here and the New exploration handoff.

## Route document titles and errors

Top-level destinations and active explorations set {Page or exploration} — Groot. Local connection errors keep current content, announce retry status and automatically retry. Compilation failures announce that the last working preview remains, with raw diagnostics in a disclosure. A first failed build shows an actionable placeholder rather than fake output. A missing exploration leaves the global navigation available. Source compiler and file boundaries are unchanged by this interface rebuild.

## Approved file workspace

Home owns project destinations. File tabs open or close explorations; closing an active tab returns Home. Dirty control drafts block tab navigation and closing. Variations use existing complete-directory alternatives and parentId, preserving original sources and empty new feedback.

Tools default open on each exploration. Controls owns declared screen/state selection and optional design controls; Preview owns interacting with declared screens and contextual details; Comments owns feedback. The vertical toolbar owns interaction, comments, fit, zoom and reload. Named screen arrows stay within declared order and disable at the ends. Screen and State creation prepares a centered, named copyable external-agent handoff; it never invents code or navigational behavior.

Optional exploration-local prompts.json is a bounded array of {prompt, createdAt} records, written by the external agent. Records must be valid text plus ISO timestamps. The server applies existing canonical path and size checks. Missing history is an honest empty state; malformed history is explained and preserved. Groot cannot inspect external agent conversations or claim a copied prompt was executed. Full-directory variation copying preserves existing prompt lineage.

## Resizable tools and recent tabs

The hide action belongs to the right inspector, with a right-canvas reopen action. A labeled vertical separator supports pointer capture and keyboard resizing. Width is a transient appearance preference for the mounted exploration, not prototype data. Recent tabs list session visits, including closed explorations, without writing to project files. Compact range rows retain native arrow-key behavior and existing optimistic save/conflict safeguards.
