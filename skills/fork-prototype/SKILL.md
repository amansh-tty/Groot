---
name: fork-prototype
description: Create an independent design alternative without losing an existing exploration.
---

# fork-prototype

## Purpose

Create an independent design alternative without losing an existing exploration.

## When to use

Before an independently requested variation or when Create alternative needs to be reproduced through an editor.

## Inputs / context required

Source demo folder, requested name, .console/config.json and existing demo IDs.

## Procedure

Copy the complete source demo to a unique lowercase-hyphenated sibling directory. Match meta.json id to its new directory, set title, parentId and local author/authorSlug. Preserve context/README assumptions, but start an empty feedback/feedback.json for the new exploration. Keep imports inside the copied demo or shared data/design-system. Verify both original and alternative are discoverable and independently editable.

## Constraints

Do not overwrite the original, expose Git terminology as required UI, copy credentials/node_modules or create cross-demo source imports.

## Expected output

A new discoverable folder with correct lineage, original unchanged, and a validated independent preview.

## V2 relationships and rationale

Use the existing parentId, description and optional rationale fields in meta.json. Rationale is supplied by the designer; never generate it automatically for a new alternative. Create Alternative accepts all three values and clears copied feedback. Controls, when present, are copied with the rest of the demo. Comparison uses two independent sandboxed previews, not source diffs.
