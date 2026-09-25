---
name: prototype
description: Create or modify a functional React exploration in the shared local repository.
---

# prototype

## Purpose

Create or modify a functional React exploration in the shared local repository.

## When to use

When the designer asks their external coding agent to change a prototype.

## Inputs / context required

Active content root: workspace/ for the user project, repository root only for NOVA / existing original explorations. Read workspace/project.json for user work. Within that root: demos/<id> folder, relevant context, README assumptions, design-system exports, data and optional prototype.config.ts.

## Procedure

Inspect actual reusable components first. Identify the intended interaction and preserve unaffected behavior. Edit the active demo's normal source files; use a new alternative if requested. Implement realistic navigation, input validation and fictional data. Keep declared states/config aligned with the source. Let the watcher update Playground and validate the actual interactions.

## Constraints

No provider integration, embedded chat, arbitrary installs or backend access from the preview. Do not edit sibling demos or established context to satisfy a local prototype change. Keep assumptions separate.

## Expected output

Changed source, concise interaction summary, explicit assumptions and actual validation evidence.
