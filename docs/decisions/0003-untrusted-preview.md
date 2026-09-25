# 0003 — Isolate preview execution before enabling generation

Date: 2026-09-23. Status: proposed; Phase 4 security gate outstanding.

Generated React is untrusted. Use staged compilation with allowlisted imports, a separate preview origin, an opaque iframe sandbox, restrictive HTTP CSP and validated diagnostics. Do not let model output execute on the backend or install packages. Preserve the last working implementation until a candidate succeeds.

This is a proposed control set, not a security guarantee. Outbound frame navigation and resource exhaustion need explicit adversarial testing. See [sandbox design](../architecture/prototype-sandbox.md). The runtime remains non-executable in Phase 1.
