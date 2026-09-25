# AI integration design

> Deferred historical V0 design. V1 does not call an LLM; external agents edit local files directly.

Status: contract only; no network requests or credentials in Phase 1.

The server selects an `AIProvider`. Its `verify` method will make a minimal real request; `generate` accepts instruction, typed provenance-bearing context, current relevant files and an AbortSignal, then yields text, structured proposals, sanitized errors and completion events. Providers cannot access arbitrary disk locations or run shell commands. Provider-specific SDK classes do not enter the web/shared packages.

The V0 implementation target is Anthropic's Client SDK using personal API keys. A subscription login is not a substitute for API authentication. The connection states will distinguish connecting, connected, authentication required and failed. Do not make a successful model claim from configuration syntax alone.

## Context building in Phase 4

1. Resolve the active project and prototype from trusted IDs.
2. Load concise structured product facts and constraints; select relevant decisions for the requested flow.
3. Inspect the actual available component/token manifest and active prototype source.
4. Include bounded recent conversation and relevant compilation/runtime diagnostics.
5. Label assumptions and proposals separately. Cap each section and the total budget; report omissions, never silently replace facts with a model assumption.
6. Record section identifiers/hashes sent, without logging credentials or duplicating private content in diagnostics.

Generation returns a bounded structured file proposal. The server checks allowed filenames and imports, stages and compiles candidates, audits changes, and promotes only a validated candidate. A failed generation or compile leaves source/preview at the last working implementation. The UI shows proposed assumptions and actual validation results. Cancelling must abort upstream work and prevent later promotion from that request.

Credentials initially stay in process memory or a backend environment variable. The browser may submit a user-entered key once over loopback, but never receives a saved key. Refresh/restart prompts for a process-held key again. OS keychain persistence is a later separately verified option. No `VITE_*` key, project secret file, token export, raw credential logging or Claude OAuth extraction.
