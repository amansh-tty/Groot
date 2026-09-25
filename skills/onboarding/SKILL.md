---
name: onboarding
description: Help a designer orient to an existing Playground checkout, without tours or accounts.
---

# onboarding

## Purpose

Help a designer orient to an existing Playground checkout, without tours or accounts.

## When to use

When setting up a checkout or explaining how an external agent works with Playground.

## Inputs / context required

Repository root, runtime versions and the user's editor/agent.

## Procedure

Check Node 24.x and pnpm 11.19.0, install dependencies if needed, then run pnpm dev. Point to the pre-filled NOVA demos. Explain AGENTS.md, relevant context files and explicit skill paths. For a setup error, report the actual command and actionable cause.

## Constraints

Do not create AI-provider onboarding, credentials, accounts, popups or forced tours.

## Expected output

A running local workbench and a concise explanation of which local files the agent should edit.
