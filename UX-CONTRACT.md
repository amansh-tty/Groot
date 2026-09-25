# Workbench interaction contract

The existing V1 navigation and runtime tokens remain canonical; see DESIGN.md.

| Capability     | Canonical owner                              | Source of truth                | Allowed variants                   | Verification           |
| -------------- | -------------------------------------------- | ------------------------------ | ---------------------------------- | ---------------------- |
| Select/Listbox | Native labeled select                        | V1 viewer / DESIGN.md          | OS popup                           | iteration browser test |
| Form           | FeedbackPanel / ControlsPanel, shared Button | shared Zod schemas             | inline non-modal forms             | iteration browser test |
| Scrollbar      | workbench.css global baseline                | DESIGN.md                      | inspector independent scroller     | browser screenshots    |
| CRUD           | Workbench file operations                    | JSON files and revision hashes | comments / controls / alternatives | workbench.test.ts      |

Feedback create/edit retains the draft on failure and reports local persistence. Delete requires an inline confirmation with Keep comment focused. Resolve is reversible. Comments remain open when an external agent changes code unless the designer requests resolution.

Controls preview immediately and persist on Save changes. Discard restores the last loaded file values. Undo restores the most recently saved values in the current mounted controls session. External revision conflicts require reload; they never silently overwrite another file. Native keyboard sliders are canonical.

No native browser dialogs for normal actions. The narrow beforeunload lifecycle warning protects unsaved controls on actual page unload. Status/errors remain inline, with live-region semantics. English content and current local-date formatting remain unchanged. Comparison uses independent frames, scroll, screens and states; no implicit synchronization.
