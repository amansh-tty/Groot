---
name: feedback
description: Read and address file-based element feedback with the designer in control.
---

# Feedback

## Purpose / when to use

Use when asked to review or implement feedback on a local exploration.

## Inputs

Read demos/<id>/feedback/feedback.json, meta.json, relevant context and source.

## Procedure

1. Filter the existing JSON array for status open. Match prototype, screen/state, elementId (data-playground-id), component, label and selector fallback.
2. Inspect the real component and NOVA constraints; selectors may be stale. Clarify only genuine ambiguity.
3. Make scoped source changes, preserve stable IDs, and validate interactions through Playground.
4. Report changes and validation. Do NOT mark comments resolved unless the designer explicitly asks. The designer owns acceptance.

## Outputs

Source changes and a concise report referencing comment IDs; feedback remains readable normal JSON.

## Constraints

No LLM integration. Preserve IDs, timestamps and unrelated comments. Do not silently convert feedback into product facts. The app uses revision checks; external agents should reread before editing a file.

## Example

“Read open feedback for Emergency Booking Simplified and address the CTA feedback” means locate confirm-appointment, improve its relationship to the summary using NOVA components, test it, and leave the comment open for designer review.
