# GROOT-001: portable prototype artifact

Editable TSX/JSX stays in its exploration directory. `prototype-compiler.ts` owns the shared esbuild/runtime/HTML compilation used by both `Workbench.preview()` and `exportPrototype()`. Preview retains its revision/fingerprint cache; export always compiles current source and fails rather than exporting a cached previous build. Neither path executes the prototype or its configuration in Node.

## Export

From the repository root, after installing dependencies:

```sh
pnpm build
pnpm groot export emergency-booking --example
```

For a user exploration, omit `--example`:

```sh
pnpm groot export my-exploration
```

The default content root is `workspace/`. `--example` explicitly selects the original NOVA content root. The command prints an absolute path under `dist/exports/<example|workspace>/<id>/<timestamp>/prototype.html`. Each export has its own directory and never overwrites an existing HTML file. Generated files are already ignored by Git. Rebuild after changing compiler code; edits to exploration source do not require rebuilding Groot before export.

Copy that HTML anywhere. It contains React, React DOM, prototype code, CSS, imported data, configuration and the existing message bridge. No server, dependencies, repository files or network APIs are needed to run it. Open it directly in a browser or serve it with a static HTTP server.

`src/App.tsx` is preferred; `src/App.jsx` is also supported. The optional configuration stays `prototype.config.ts`. Standalone documents start with the same default screen/state as local preview. A parent viewer can select declared screens/states using the unchanged `playground-host` message contract. The HTML contains no new state-picker UI. It does not contain a feedback database or save service.

## Small asset contract

- Import local PNG, JPG/JPEG, GIF, WebP or self-contained SVG files, then use the imported value as an image source. CSS `url(./image.png)` is bundled too. These assets become data URLs inside the HTML.
- Keep imports within the exploration, active shared data/design system, or existing allowed dependencies. Filesystem boundary checks also apply to assets.
- Export rejects literal JSX `src`/`poster` URLs: import the image instead. It rejects external CSS asset URLs/imports and SVG files containing scripts or external references.
- Fonts, audio/video, arbitrary public directories, remote images/CDNs and API-backed experiences are not supported. There is no download/proxy pipeline. Unsupported imported file types fail through esbuild diagnostics.
- Dynamically constructed resource URLs cannot be reliably identified by these limited static checks. They are unsupported; the restrictive CSP blocks network access. Exercise the exported artifact to validate a particular exploration—compilation alone is not a universal portability guarantee.
- Maximum local input size during export: 5 MB per non-dependency file; final HTML limit: 20 MB. Data-URL embedding increases size.

## Validation evidence

On 27 September 2026, exported NOVA `emergency-booking` using the public command: **754,330 bytes (about 737 KiB)**.

Artifact: `dist/exports/example/emergency-booking/1790503569128/prototype.html`.

The exact file was copied to `C:/Users/rohan/AppData/Local/Temp/groot-portable-VV1jQK/prototype.html`. The test confirmed no Groot server was listening successfully on its normal ports. An isolated static server could serve only three explicit test files and a favicon response. It could not serve repository files or dependencies.

Validated the full seven-step booking flow through confirmation, all seven declared screens, all six declared states via the unchanged iframe bridge, and direct `file://` rendering/interaction. A separate JSX fixture proved an imported PNG renders after its entire source directory was deleted. The browser recorded only the isolated HTML pages and the copied file URL: **zero Groot API, external-resource, source-file or node_modules requests**, and no page/runtime errors.

Run the focused test (stop `pnpm dev` first):

```sh
pnpm test:export
# Or test a specific exported Emergency Booking artifact:
pnpm test:export dist/exports/example/emergency-booking/<timestamp>/prototype.html
```

The test leaves its isolated HTML directory for inspection, prints the network trace, and shuts down its browser/static server. It does not start Fastify. It is intentionally an Emergency Booking acceptance test, not a universal tester for arbitrary exports.

Also passed: 27 Vitest tests (including export assets/failure/boundary tests), three existing Playwright workflows, production restart smoke, typecheck, lint and build. No demo source was modified.

## Next-checkpoint boundary

The artifact is suitable as an upload payload for a future hosted viewer. It is executable, untrusted browser content, not a security-approved application. A hosted viewer must enforce its own sandbox/CSP and authorization independently of the artifact and must not expose credentials to it. Private storage, uploading, authentication, metadata registration and a publishing skill are deliberately not implemented here.
