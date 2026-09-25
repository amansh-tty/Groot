# Claude integration research

Checked 2026-09-23 against official documentation. This is an engineering decision record, not a claim of negotiated Anthropic approval.

## Findings

The [Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview) describes a library around Claude Code's agent loop, built-in tools and permissions. It says third-party developers cannot offer claude.ai login or subscription rate limits without prior approval. API-key authentication is the documented alternative. SDK use for end-user products is governed by Commercial Terms; Claude Code branding cannot be used as the integration's feature name.

The [quickstart](https://code.claude.com/docs/en/agent-sdk/quickstart) documents `ANTHROPIC_API_KEY` and supported cloud credentials (AWS/Bedrock, Google and Foundry variants). TypeScript installs can bundle a platform-specific Claude Code binary through optional dependencies. This brings packaging and tool-permission responsibilities that the direct API client avoids.

The [legal and compliance page](https://code.claude.com/docs/en/legal-and-compliance) distinguishes hosting an unmodified Claude Code binary from integrating Claude capabilities into a third-party application. Its hosting conditions allow end-user authentication to the unmodified binary under specified terms, while its authentication guidance prohibits third-party applications from offering Claude login or routing requests through subscription credentials. Developers must not collect or intermediate Claude account tokens. These distinctions do not establish that Playground's proposed integrated subscription-backed workflow is approved.

## Decision

Do not ship a Claude subscription/OAuth connector, parse CLI credential files or request passwords. Use a personal Anthropic API key through the local backend in V0. A local unmodified CLI experience could be reconsidered only after clarifying the precise distribution/authentication model with Anthropic. It must preserve the binary and its authentication methods, not impersonate the official product.

The SDK can use API-key authentication, but the direct [Claude API/client SDK](https://platform.claude.com/docs/en/api/overview) is the smaller fit for V0's bounded request-and-file-proposal workflow. It avoids granting general agent tools or bundling a CLI. The provider interface leaves that choice replaceable.

API billing is distinct from Claude subscription billing. Inference runs remotely even when the application and files are local. Phase 1 performs no paid provider calls; live credential verification remains untested until Phase 2 and a real user key.

Registry versions observed: `@anthropic-ai/claude-agent-sdk` 0.3.280 and `@anthropic-ai/sdk` 0.128.0. Neither is installed in Phase 1. Recheck versions, terms and model availability when implementing the provider.
