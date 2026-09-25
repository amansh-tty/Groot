# Prototype execution boundary

Status: **design only**. Phase 1 does not compile or execute model output. The constants in `packages/prototype-runtime` are not proof of isolation.

## Planned controls

Treat generated/imported source as hostile. Accept a narrow file manifest and controlled React/Lucide dependency set. Resolve modules through an allowlist, including transitive resolution; disallow Node built-ins, network URL imports, arbitrary package resolution and install hooks. Compilation transforms code without evaluating it in Node, uses resource/time limits and runs in a bounded worker. Validate canonical path containment against traversal, drive/UNC paths, symlinks, reserved Windows names and case collisions.

Serve compiled preview content from a separate loopback origin with no administration/API routes. Render it in an iframe with `sandbox="allow-scripts"`, without same-origin, forms, downloads, popups or top navigation permissions. An opaque sandbox origin prevents access to parent DOM, cookies and storage. React form handling can work without permitting native form submission.

Deliver HTTP CSP on the preview response: deny connections, child frames, objects, forms and base URLs; allow only the vetted bundled scripts/styles and necessary data images. Do not rely on editable model-provided meta tags. Use unpredictable per-build script nonces or hashes when selecting the final serving design. Make dependency code available as bundled assets so no CDN/network access is needed. Keep the parent API's Host/Origin/Fetch Metadata checks; sandbox requests can have Origin `null` and must be rejected.

Diagnostics cross via postMessage only after matching `event.source` to the current iframe and validating a bounded schema/build ID. Opaque origin messages cannot be authenticated by an origin string alone. Messages may report errors; they cannot invoke filesystem or administration actions. Invalidate old build messages after refresh/version changes.

## Required adversarial tests before release

- Parent DOM/storage, backend fetches, websocket and image/CSS exfiltration attempts.
- Form submission, popups, downloads, frame/top navigation and generated external links.
- Traversal, symlinks, Windows drive/UNC/reserved names, malicious imports and oversized source.
- Infinite loops, resource-heavy compilation, malformed diagnostics and stale/spoofed postMessages.
- Failed compilation/runtime startup retains the last working prototype; cancellation cannot promote a late candidate.

## Remaining limitations

Iframe sandbox and CSP do not provide a full OS sandbox or guaranteed CPU/memory isolation. Self-navigation can change the iframe document; network denial must be tested rather than assumed from `connect-src`. Browser/OS defects, extensions and other local processes are outside this boundary. If comprehensive preview egress restriction cannot be achieved, document the residual risk and keep arbitrary generated execution disabled until a workable V0 approach is validated. Do not claim filesystem safety based on string-prefix checks alone.

References: [MDN iframe sandbox](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe), [MDN CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy).
