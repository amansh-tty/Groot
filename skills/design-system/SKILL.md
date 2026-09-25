---
name: design-system
description: Identify and reuse Playground project components, design tokens and established patterns when generating or reviewing prototypes.
---

# Design system

## Purpose

Keep explorations consistent with the project's actual reusable UI without inventing component capabilities.

## When to use

Before implementing or reviewing a prototype's visual structure and interaction controls.

## Required inputs

For NOVA, inspect `packages/design-system/src/index.tsx` and `tokens.css`; the viewer uses those same files. Product fixtures live in `data/`.

Available component exports and prop definitions, project tokens, existing prototype usage, brand guidance and dependency allowlist.

## Procedure

1. Inspect the real manifest/source for applicable components and supported props.
2. Map requested interactions to existing controls and patterns. Prefer tokens for color, typography, spacing and focus states.
3. Identify gaps; use a small local composition if it meets the need. Label any proposed new pattern as a proposal.
4. Check contrast, labels, keyboard focus, disabled/loading/selected states, reduced motion and responsive layout.
5. Return the chosen components/tokens, local compositions and unresolved gaps to generation or review.

## Expected outputs

A concise mapping to real reusable elements, explicit design-system gaps and token-consistent implementation guidance.

## Constraints

No arbitrary package installation or fabricated import paths. Do not overwrite established tokens without user intent. Keep the workspace neutral by default and avoid decorative AI styling.

## Example

Use the project's existing Button for booking actions and the established 8px spacing scale. If no date picker exists, propose an accessible local slot selector instead of importing a new library automatically.
