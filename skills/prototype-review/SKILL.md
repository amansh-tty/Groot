---
name: prototype-review
description: Review a Playground prototype against requested behavior, interaction completeness, product constraints and actual validation evidence.
---

# Prototype review

## Purpose

Find concrete gaps before a generated experience is treated as usable.

## When to use

After a prototype candidate is generated or modified, or when a designer reports a broken interaction.

## Required inputs

For V1, review the external agent's actual changes in `demos/<id>/src`, its declared `prototype.config.ts` states, and local feedback. There is no provider-generated proposal pipeline.

Original request, labeled context, candidate files, previous working files where relevant, and available compilation/browser/runtime evidence.

## Procedure

1. Trace the main user journey and requested changes through the source and available preview.
2. Check navigation, editable inputs, validation, empty/error/loading states, confirmation and back/cancel behavior where required.
3. Compare constraints, terminology, components and tokens. Distinguish unmet requirements from optional stylistic preferences.
4. Review focus/labels, viewport behavior and untrusted-code boundary violations. Surface any attempt to call backend administration or load an unapproved dependency.
5. Report reproducible issues with severity, trigger, expected/actual behavior and minimal correction. Explicitly list unexecuted checks.

## Expected outputs

Actionable findings, exercised journeys, remaining uncertainty and a recommendation on candidate readiness. A clean source review is not proof that browser interaction was tested.

## Constraints

Do not silently mutate product facts or rewrite the prototype during review. Never claim execution evidence from static inspection. A failed candidate must not displace the last working version.

## Example

“Selecting an occupied slot still enables Confirm” is a concrete booking constraint failure. “Make it more modern” is not a review finding without a stated design requirement.

## V2 iteration review

Check stable feedback targets after edits; leave feedback open unless the designer requests resolution. Verify each comparison side independently and preserve parent relationships and designer-written rationale. Validate declared controls against their values file; do not introduce hidden local-only styling overrides.
