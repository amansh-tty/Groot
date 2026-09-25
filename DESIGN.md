---
version: alpha
colors:
  background: '#131416'
  foreground: '#e9e9eb'
  primary: '#dedfe2'
  muted: '#292b2e'
  border: '#303236'
typography:
  sans:
    fontFamily: 'Inter, ui-sans-serif, Segoe UI, sans-serif'
  code:
    fontFamily: 'ui-monospace, monospace'
spacing:
  unit: '4px'
rounded:
  control: '6px'
---

# Playground design context

## Overview

A focused product exploration workbench for desktop designers. Preserve V1's dark, compact frame around the light NOVA prototype. The experience is the main surface; tools stay quiet until invoked. English local workspace; no new locale scope.

## Colors

Canonical runtime tokens remain in apps/web/src/workbench.css, mapped by Tailwind @theme to the shared Button. Sage and blue accent settings preserve semantics. NOVA owns its independent tokens in packages/design-system/src/tokens.css; its component viewer uses the same source.

## Typography

System sans for controls and headings; monospace only for repository paths. Preserve V1 sizes and restrained hierarchy; no new fonts.

## Layout

4/8px rhythm, compact toolbar, optional right inspector. Feedback uses that inspector. Comparison gives each functional frame independent scrolling. Native selects deliberately use OS popup geometry.

## Elevation & Depth

Flat neutral surfaces with minimal borders. Numbered comment markers express real comments, not decoration.

## Shapes

Small control radii and circular numbered markers. Selected items have a visible outline and text/state labels.

## Components

Reuse apps/web/src/components/ui/button.tsx. FeedbackPanel owns comment forms/status/actions. Native labeled fields own input and select behavior. Global scrollbar styles live in workbench.css. Non-modal inspector keeps normal tab order. Inline delete confirmation names the comment; cancel receives focus. Save errors retain drafts; backend checks file revisions.

## Do's and Don'ts

Preserve keyboard focus and reduced motion. Do not turn the prototype into an inspector or add AI chat. Do not change the NOVA design system to restyle the workbench.
