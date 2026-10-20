# Groot integration checkout

Repository: https://github.com/amansh-tty/Groot.git. Latest main baseline: 09a0feb. Branch: groot-workspace-ui.

Original local content from Downloads/falsh/Groot is preserved byte-for-byte in the inventory. Its TypeScript workspace includes are retained. Local uncommitted app behavior (user design-system preview and project-aware labels) is carried by the new shell; the complete original local diff is saved as original-local-changes.patch. The original folders remain untouched.

The first port was saved in a recoverable Git stash before aligning this isolated branch with newer GitHub main. Current changes are applied on the latest baseline, retaining the external workspace launcher, scaffolder and export support. New shell owners replace WorkbenchApp.tsx/workbench.css. Dependencies and latest package scripts are unchanged.

No GitHub push or merge has been performed. Changes are maintained locally on this branch for review. Validation results are added below after checking this checkout.

## Validation

- Typecheck, lint and production build passed against latest main 09a0feb.
- 35 unit tests and all 8 browser tests passed.
- Portable export smoke passed, including standalone HTTP/file operation without Groot API access.
- Production restart smoke passed: app, alternatives and appearance settings survive restart. Its old Playground page assertion was updated to the approved Groot brand.
- Format check and Git diff whitespace check passed.
- All 94 preserved content files match their original SHA-256 values. Original folders and their Git state were not modified.

Preview: http://127.0.0.1:4319/ . Environment and preview data are local ignored files. The prior working preview remains on 4318.

GitHub read access is verified; write/push permission has not been tested. No push, PR or remote merge was performed. This branch is an isolated integration copy; Git history records its commits. The original-design-system behavior and TypeScript source includes are retained. A recoverable stash also preserves the first pre-alignment port.
