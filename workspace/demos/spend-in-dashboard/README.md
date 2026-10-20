# Spend.In — Existing dashboard

## Source facts

Recreated only Figma frame https://www.figma.com/design/lpZbfIkAWpBbfFSTA3E9F9?node-id=129-9331 (1440 × 1024). Original Figma is unmodified. Note that this link has a different file key from the earlier design-system selection (4Ebg54utk4cPVLQFNY1Mja); the observed overlapping styles match, rather than assuming file identity.

Preserves Main Menu, Preferences, Spend.In, John Cornors, monthly bar geometry, totals, transaction records, category values, visible balance, typography declarations, 286px sidebar, 80px header, 726/340px content columns, 24px gaps and card positions. Source uses 2024 for the chart and January 2022 for transactions/balance. Source spellings Mei/Des and inconsistent currency punctuation are retained. Two balance layers occupy the same position; the top visible $120,435.00 layer is represented rather than the hidden $20,435.00 layer. Category values sum to $19,270 while the center says $19,760,00; the discrepancy is preserved, not corrected.

## Reuse and scope

Imports DesignSystemRoot, Text, DashboardPanel and DashboardAction from the existing user design-system. DashboardPanel composes Card; DashboardAction composes Button with the observed 10px radius, 55px height and outline variant. Existing pricing/pill defaults and NOVA remain unchanged. Shared CSS color variables provide primary, text, muted, border and success colors. Chart #725CFF, canvas #F6F7F9 and category hues remain screen-specific observations, not invented system-wide tokens.

Exact Figma-provided SVGs are saved in assets/ and embedded unchanged as data URIs in src/assets.ts because preview CSP permits data images only. manifest.json records provenance, not runtime network dependencies. Icons retain their intrinsic SVG dimensions. No installs or backend calls are made by the prototype.

## Functional interactions and assumptions

- Every month bar supports hover, focus and click highlighting. Only June's $15.030 tooltip is specified; other months display Not provided instead of fabricated values. Bar heights are source geometry, not a reconstructed dataset; the axis itself is nonlinear.
- Previous/next year controls change the selected year. Only 2024 exists in the source; other years show a local no-data state with return action. They do not reuse 2024 values as if real.
- Search filters the three visible transaction records only. This is a bounded implementation assumption because global-search behavior is not supplied. Clearing restores all rows.
- Date/Amount/Status table controls sort the local records, toggling direction. Equal amounts retain record order. No new records are generated.
- Navigation changes selected styling while retaining this dashboard. Destination screens do not exist. Category legend hover/focus updates the center readout; no different donut geometry is invented.
- Notification/profile/overflow/date-range/Top Up/Transfer/Dark Mode/Log Out controls explain that their destination/open state was not supplied. No invented menus, payment flows, dark palette or logout session behavior.
- Narrow previews preserve the desktop composition with horizontal scrolling rather than inventing a mobile layout. Keyboard focus is visible; motion is not used.

## Known fidelity limitations

The Figma asset URL for the portrait returned a 32×32 blank PNG instead of the visible photo. A targeted retry using download_assets on portrait node 129:9338 was blocked by the connected Figma Starter plan tool-call limit. The returned asset is preserved; the portrait is not replaced with an invented person. This is an unresolved visual mismatch.

Plus Jakarta Sans and Space Grotesk are declared with sans-serif fallbacks; font binaries were not provided. Typography cannot be claimed pixel-identical on machines without those fonts. Existing source colors are preserved without claiming a full accessibility contrast audit. Source static chart assets do not reveal additional numerical datasets or interaction specifications.

## Validation

TypeScript and isolated Playwright checks cover the actual sandboxed preview: initial tooltip, keyboard chart focus, year/no-data recovery, search/clear, sorting, navigation selection, bounded action notice and non-broken embedded images. The image-load test does not establish that the blank portrait is correct. Visual inspection at 1440×1024 compared layout against the Figma screenshot. Remaining check results are recorded in the delivery message.
