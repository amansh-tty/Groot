# Pickolab design-system showcase

This is a component catalog, not a product flow. It renders shared components from ../../packages/design-system/src; no duplicated button/card examples.

Open the user workspace → Design System. The workbench displays the first catalog exploration tagged design-system through its existing sandboxed PrototypeView. Use Screen: Foundations, Components, Source & limitations. It is also available in Explorations for comments and normal preview tools. With no tagged showcase, the original design-system guidance remains visible. NOVA's viewer is unchanged.

See ../../context/DESIGN-SOURCE.md for source IDs, supported scope, conflicts, assumptions and omissions. Existing project metadata is preserved. No usability findings are claimed.

## Validation

Passed typecheck (now includes workspace sources), lint, build, all 25 unit tests, isolated Playwright component catalog test and existing external-edit/fork/recovery test. Desktop and narrow screenshots inspected. The catalog test exercises shared button styles, keyboard activation, disabled state and NOVA separation. No exhaustive visual equivalence is claimed, particularly for the unbundled font. Optional Python static audit could not run because Python is unavailable.
