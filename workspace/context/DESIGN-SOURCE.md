# Pickolab source and implementation scope

Source: https://www.figma.com/design/4Ebg54utk4cPVLQFNY1Mja?node-id=202-3391

This is the separate user workspace, already named groot. Its existing project.json was preserved. NOVA and all original explorations are unchanged. No product flow is specified.

## Observed facts

The selection contains Typography, Color Style, Button, Cards, Content and Other boards. Button axes include Primary/Secondary/Minimal, Small/Medium/Large, text/icon placements and Main/Hover/Pressed/Focused/Disable. Testimoni and Pricing Plan have web/responsive variants; content includes benefit blocks, how-it-works and success stories. These are inventory facts, not a claim that all variants are implemented.

The implementation uses exact resolved colors and selected Plus Jakarta Sans text styles from inspection. Typography letter spacing -2/-3 is percentage spacing, represented as -.02em/-.03em as confirmed by generated pixel values. Full font/weight/size combinations are not inferred.

Pricing Plan/Web (164:19181) supplies the reusable surface: #F3F5F7, 32px padding, 12px radius, 24px feature gap and 12px icon gap. Primary large text button (121:6102) supplies 24px horizontal/13px vertical padding, 52px height, 30px radius, 16px semibold text. Four additional narrowly scoped Figma reads supplied genuinely missing state details: 2:927 hover #5E43D8; 2:933 pressed #432EB5; 2:939 focus with #CEBEFE border; 2:945 disabled at 40% opacity. These states use 50px height/60px radius.

## Explicit implementation decisions and uncertainties

- No font files were returned by Figma. CSS declares Plus Jakarta Sans with sans-serif fallback; no external font request or preview security change is made. Exact font rendering needs a licensed local font asset and an explicit supported loading path.
- Secondary/100 is #E0E9F4 on the palette board and #F3F5F7 on the pricing card. Preserve both source-specific values, using the latter only for this card. Neutral/500 and Neutral/900 also conflict; both are retained in conflictingColors and shown visually.
- Main button and state geometry differ. Static state samples preserve dimensions; live interactions keep the main geometry to prevent layout shift. Focus adds a visible outer outline for keyboard access.
- The observed Button/Card/Small effect is 4px/8px offset, 24px radius, #246BFD40. Generated drop-shadow CSS used 12px blur. A standalone box-shadow sample follows the named effect definition, not a silently reconciled icon-button reconstruction.
- Catalog layout, wrapping at narrow widths and HTML semantics are local implementation decisions, not Figma breakpoint tokens.
- Source colors are preserved, not claimed to meet all accessibility contrast requirements. Default purple/white normal text needs contrast review before production.
- Variable endpoint data provides resolved named styles, not proof of complete variable collections, alias relationships or modes. Code Connect metadata access was restricted by seat/plan.

## Intentionally unsupported

No complete token taxonomy, theme modes, universal spacing scale, inferred breakpoints, icons, image assets, secondary/minimal or smaller button variants, full pricing/testimonial/content compositions, toggle behavior, forms or product flows. The Card is explicitly an extracted surface rather than a recreation of the full Figma pricing card.

## Reuse

Import Button, Card, Text, DesignSystemRoot and the observed data from workspace/packages/design-system/src. Wrap consumers in DesignSystemRoot. The preview compiler resolves @playground/design-system to this user library when scope=user; root NOVA resolves separately. The showcase uses an explicit relative import to ensure TypeScript also checks the intended library.
