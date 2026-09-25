# Contributing

Start with [README.md](README.md) and the current [V1 definition](docs/product/v1.md). Changes should help a designer work with an external coding agent in the shared repository. Discuss scope changes before introducing infrastructure or dependencies.

## Local workflow

1. Use Node 24.x and pnpm 11.19.0. Install with `pnpm install --frozen-lockfile`.
2. Run `pnpm dev`. Use a separate absolute `PLAYGROUND_DATA_DIR` for test projects.
3. Make a small, coherent change. Keep feature logic near its consumer.
4. Run `pnpm check`, `pnpm test:e2e`, `pnpm test:smoke`, and `pnpm format:check` as applicable. Browser tests require `pnpm exec playwright install chromium` and a current build.
5. Document actual checks, limitations, schema changes and visible behavior in your pull request. Include a screenshot for visual changes.

Automated tests must not alter the user's demos. Use isolated workspace copies for external-edit, fork and restart tests. No AI integration belongs in V1. Prefer behavioral assertions; test relevant paths rather than rerunning everything after trivial edits.

## Reporting bugs

Include OS, Node/pnpm versions, build/commit, reproduction steps, expected/actual behavior and sanitized error text. Never include API keys, real patient data, private product context, local credential files or a database containing personal information. Use fictional examples.

For security reports, avoid publishing exploit details with real credentials or personal data. This new repository has no private disclosure channel yet; contact the maintainer privately through the eventual hosting platform before sharing sensitive details.

## Proposing changes

Explain the designer's problem, current workaround, smallest useful behavior and how to validate it. Separate established research from assumptions. Read existing decisions first. Large features outside V0 belong in the roadmap, not a foundation patch.
