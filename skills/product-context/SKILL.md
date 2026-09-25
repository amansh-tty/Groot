---
name: product-context
description: Assemble relevant Playground product context while separating user facts, established decisions, assumptions and proposals.
---

# Product context

## Purpose

Give prototype work a concise, traceable product basis without turning model guesses into established knowledge.

## When to use

Before generating/modifying a project prototype or interpreting research for a design task.

## Required inputs

User instruction, active project ID, structured context, relevant decisions and current flow/prototype reference. Treat absent fields as missing information, not a prompt to invent facts.

## Procedure

1. Identify the requested user outcome and the active experience to change.
2. Select relevant overview, users, problems, goals, principles, constraints and terminology. Use the project's actual component/token manifest when applicable.
3. Label each entry as fact, decision, assumption or proposal; retain existing provenance. Note conflicts rather than silently choosing a truth.
4. Ask only for missing information that prevents a useful or safe implementation. Otherwise state a reversible assumption.
5. Return bounded context sections and list omissions due to relevance or budget. Do not include unrelated files or credentials.

## Expected outputs

A task summary, relevant labeled context, constraints, unresolved contradictions, explicit assumptions and source identifiers. User context remains unchanged unless the user explicitly adopts or edits it.

## Constraints

Never promote an AI assumption into a fact automatically. Do not send full project directories by default. Use fictional data for examples and preserve sensitive-context boundaries.

## Example

For “Reduce emergency booking to two steps,” retain front-desk users, required appointment fields and scheduling constraints. If urgency categories are absent, label a proposed “urgent/routine” distinction as an assumption instead of a clinic policy.
