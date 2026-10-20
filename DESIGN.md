---
version: alpha
colors:
  background: '#1f1f1f'
  foreground: '#f2f2f2'
  primary: '#eeeeee'
  muted: '#2b2b2b'
  border: '#393939'
typography:
  sans:
    fontFamily: 'Inter, Segoe UI, system-ui, sans-serif'
  code:
    fontFamily: 'ui-monospace, Consolas, monospace'
spacing:
  unit: '4px'
rounded:
  control: '6px'
---

# Groot design context

## Overview

Groot is a local workbench for designers exploring directions with their existing external coding agent. The user approved the three latest generated home/editor/dialog studies, guided by their attached Figma-style file architecture and Paper-style vertical toolbar. The user explicitly rejected purple/blue shell accents retained by the generated editor. All shell surfaces and interaction cues are grayscale; color belongs to imported prototypes. The actual Toolcraft reference informs compact neutral field construction, panel grouping, fine dividers and contextual canvas tools. The approved direction replaces the earlier light and dark experiments.

This is an existing file-based React/TypeScript/pnpm app, not a generated Toolcraft renderer product. Apply Toolcraft visual semantics through the workbench's shared shell primitives. Never patch generated Toolcraft internals or add unrelated canvas settings, exports, timeline, layers or an AI chat to imitate the source tool.

## Colors

Model B: apps/web/src/studio.css is the single canonical shell stylesheet. main.tsx imports it directly; the former shell.css and workbench.css are no longer loaded. Its semantic variables feed the Tailwind @theme aliases and shared Button primitive. DESIGN.md mirrors accepted values.

Canvas #1f1f1f; panels #242424; fields #303030; hover #3b3b3b; border #393939 and stronger boundary #555555. Text #f2f2f2, supporting #bebebe. Primary #eeeeee with #202020 text. Focus, selection, status and warning cues are neutral with explicit labels. No colored branding, gradients, dotted black void or glass treatments. Global scrollbar and forced-colors fallbacks remain canonical in studio.css.

Imported Pickolab/Spend.In colors belong to workspace/packages/design-system/src; NOVA owns packages/design-system/src. Both remain unchanged. Their CSS is isolated from the workbench when run as prototypes. In particular the dashboard's purple never becomes the shell's accent.

## Typography

Inter with Segoe UI/system fallback, no external font requests. Body 14px/1.6 with normal-to-slightly-open tracking; controls 13–14px, card titles 17px, screen names 18px, library heading 30px. Supporting metadata is 11–13px only where compact labels are necessary. Use 8px spacing rhythm, 16–24px panel padding and 24–40px content gutters. No condensed small text or negative tracking on control labels. Prototype font limitations remain documented in its own notes.

## Layout

A 56px file tab strip owns Home and open exploration tabs, including close actions. Home uses a 216px destination sidebar and preview-led two-column library; search and platform filters share one row. The editor uses a 216px variation/history sidebar, a 52px vertical interaction/zoom toolbar, central canvas and a 300px inspector open by default. Canvas header owns viewport/fit; each declared screen has a name and bounded previous/next arrows. The inspector tabs are Controls, Preview and Comments. Controls owns screen/state handoff and opt-in design controls; Preview owns flow navigation and details; Comments owns feedback. No duplicate comments list in Controls. Responsive layout stacks panels and retains source viewport behavior.

Fit respects both available width and height. Desktop shows a declared 1440x1024 viewport; mobile shows 390x844. Actual size returns to unscaled responsive desktop viewing. Resizing and fit toggles preserve the same iframe and its current interaction state. Do not invent a mobile layout for a fixed desktop import. The inspector defaults open. Preview contains source paths, rationale and assumptions. On narrow displays tools reflow below the stage rather than overlaying it. Guides and the library keep document scrolling.

The library renders real lazy inert sandbox previews, twelve initially with Load more, never fabricated preview art. Comparison panes remain independent and prefer real parent/child alternatives; no unrelated showcase is silently selected as a comparison partner.

## Elevation & Depth

Toolcraft-like panel boundaries and very subtle neutral insets. Only modal dialogs and the prototype frame use restrained shadow to establish depth. No lifted marketing cards, gradients, colored decoration or stock imagery. The charcoal canvas recedes behind the prototype. Reduced-motion disables transitional movement.

## Shapes

6px controls, 8px panels/dock, 4px prototype artboard, 10px app-owned dialog. A mobile preview uses a restrained device boundary without invented phone art. Real feedback numbers, actual lineage and explicit selected states carry meaning.

## Components

Shared shell Button: apps/web/src/components/ui/button.tsx, using semantic primary/outline/ghost classes in studio.css and consistent 34/36px sizes. Shared Dialog: components/ui/dialog.tsx, using an app-owned HTML dialog with accessible title, modal background isolation, focus cycle, Escape and return focus; pending alternative creation prevents accidental dismissal. Native labeled selects are canonical, with OS-owned popup geometry deliberately accepted. FeedbackPanel/ControlsPanel retain revision-checked JSON persistence. Forms keep drafts on failed saves. LiveThumbnail owns read-only gallery previews. PrototypeView owns the session/dock/inspector; CompareView owns explicit independent comparison choices.

## Do's and Don'ts

Prioritize the activity: select a direction, interact, review, fork, compare. Keep technical detail in contextual help and diagnostics. Show the Controls tab always, but offer design adjustments only if a real contract exists. Never auto-resolve feedback or alter designer rationale. Never invent missing prototype behavior or change imported source designs to match the shell. Preserve keyboard focus, labels, reduced motion, project isolation and the opaque iframe/network boundary. Do not describe visual preferences or pixel measurements as proven usability research.

## Decision evidence

The approved implementation plan and current captures live in docs/groot/. Visual verification lives in design-qa.md. Prior reports in docs/redesign/ and docs/refinement/ are historical. The earlier light/violet refresh report is historical; this direction supersedes its shell decisions while retaining its verified file-based behavior and preserved imports.
