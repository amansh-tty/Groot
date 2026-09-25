# Dependency verification

Checked 2026-09-23 using official documentation and `npm view <package> version` / peer metadata. Exact installed versions are in package manifests and `pnpm-lock.yaml`.

- Node: local 24.19.0; [release schedule](https://nodejs.org/en/about/previous-releases) identifies 24.x as LTS. Keep the tested Node 24 line; [built-in SQLite](https://nodejs.org/api/sqlite.html) avoids an external database or native npm addon. Local driver reports SQLite 3.53.3.
- React/react-dom 19.3.0: [current versions](https://react.dev/versions). Client-only React root; no framework/server component infrastructure.
- Vite 8.3.0 and React plugin 6.1.1: [guide](https://vite.dev/guide/). Registry engine range includes the selected Node version. Production build validated locally.
- TypeScript latest is 7.0.2; selected **6.0.3** because typescript-eslint 8.70.1 declares TypeScript `>=4.8.4 <6.1.0`. [TypeScript docs](https://www.typescriptlang.org/docs/). Do not suppress peer warnings to chase a latest tag.
- Tailwind and Vite plugin 4.3.3: [Vite installation](https://tailwindcss.com/docs/installation/using-vite), CSS-first configuration.
- shadcn CLI latest 4.21.0 researched, not a runtime dependency. [Vite/manual setup](https://ui.shadcn.com/docs/installation/vite); source-owned button uses Radix Slot 1.3.3, CVA 0.7.1, clsx 2.1.1 and tailwind-merge 3.7.0. Configuration retained in `components.json`.
- Lucide React 1.47.0: [React guide](https://lucide.dev/guide/react), direct named imports.
- Zustand 5.0.15: [official repository guide](https://github.com/pmndrs/zustand), a small store with no credential persistence.
- Fastify 5.12.5 and static 10.1.4: [Fastify docs](https://fastify.dev/docs/latest/), [static compatibility](https://github.com/fastify/fastify-static). Static plugin's documented `>=8.x` line supports Fastify 5.
- Zod 4.6.5: [schema documentation](https://zod.dev/), strict API payloads and parsed responses.
- Vitest 5.0.1: [guide](https://vitest.dev/guide/); peer range supports Vite 8 and Node 24 types.
- Playwright 1.63.0: [installation](https://playwright.dev/docs/intro). Install its matching Chromium separately; no paid AI required.
- ESLint 10.11.0, @eslint/js 10.0.1, typescript-eslint 8.70.1: [flat configuration docs](https://eslint.org/docs/latest/use/getting-started). Peer ranges permit ESLint 10.
- Prettier 3.9.9: [installation](https://prettier.io/docs/install), exact dev dependency. pnpm recorded a release-age exception for this explicitly selected version.
- pnpm latest observed 12.6.0; selected **11.19.0**, the installed/validated toolchain. [installation](https://pnpm.io/installation), [v11 migration](https://github.com/pnpm/pnpm.io/blob/main/blog/releases/11.0.md). Version 11 uses `allowBuilds` instead of `onlyBuiltDependencies` and workspace YAML for settings. Permit only esbuild; strict peer checking is enabled. Script execution warns on dependency drift instead of implicitly reinstalling.
- Supporting tooling: tsx 4.23.15, concurrently 10.0.5, @types/node 24.13.6 and React types 19.3.0.

Dependency versions reflect this inspection, not a promise that they remain latest. Upgrade deliberately, recheck peer/engine constraints, and run the complete relevant gates.
