# 0002 — Personal Anthropic API key for V0

> Superseded by V1: the user's external coding agent is the AI layer. No provider integration is planned for V1.

Date: 2026-09-23. Status: accepted design; implementation starts in Phase 2/4.

Use a backend-owned Anthropic Client SDK implementation behind `AIProvider`. Do not ship integrated Claude subscription login or reuse local Claude tokens. SDK documentation requires approval for third-party Claude account login; there is no such approval for this project. Separate unmodified CLI hosting terms do not resolve our integrated workflow's authorization.

The direct API supports a controlled model request without broad shell/filesystem tools or CLI redistribution. We own validation, compilation, audit and promotion. The tradeoff is separately billed API usage and implementing the bounded proposal workflow ourselves. Model inference is remote.

See [official-source research](../research/ai-authentication.md). Revisit only with documented permission or changed supported authentication requirements. No paid requests are implemented or verified in Phase 1.
