---
name: prototype-generation
description: Generate or modify functional React prototype proposals for Playground using active source, product constraints and allowlisted components.
---

# Prototype generation

> Historical V0 provider workflow. For the current external-agent architecture, use `../prototype/SKILL.md` instead. Do not implement the provider proposal mechanism below.

## Purpose

Implement the requested interaction while preserving working behavior and existing design direction.

## When to use

When a designer asks to create or change an active prototype. Phase 1 has no generation runtime; do not imply this skill enables one.

## Required inputs

Instruction, labeled context, active prototype files, component/token manifest, dependency allowlist and relevant compile/runtime errors.

## Procedure

1. Determine whether to modify the active prototype or create a new one from explicit user intent.
2. Identify constraints and existing reusable components. Record reversible assumptions when reasonable information is missing.
3. Implement complete navigation, controls, validation, state and fictional data for the requested path. Keep code understandable.
4. Return bounded relative source-file proposals. The application validates paths, compiles, audits and promotes them; the provider does not write arbitrary disk paths.
5. Report changes, assumptions and only validation results actually supplied by the runtime. On failure, propose a targeted correction while retaining the working version.

## Expected outputs

File proposals, concise change summary, explicit assumptions, required validation and any reported errors. Include realistic interaction states, not a static mockup labeled as functional.

## Constraints

No shell, install commands, unrestricted imports, credentials, arbitrary filesystem access or destructive edits without confirmation. Do not replace working source after a failed candidate or create an unrelated project to avoid editing the active one.

## Example

For a two-step booking change, preserve patient selection and time-slot availability, combine compatible fields, retain validation and confirmation, and explain the changed sequence. Do not merely rename step labels.
