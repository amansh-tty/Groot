# Deploy Groot on Vercel

Import the GitHub repository `amansh-tty/Groot` into Vercel and use the repository root as Root Directory. The root `vercel.json` selects the public static build and its `dist/client` output. It pins pnpm 11.19.0 for installation and building. Keep Node.js on 24.x; the existing package engines require 24.19.0 or later within 24.x. No environment variables, local server, SQLite service or MCP endpoint are needed for the public demo.

The new public-demo code currently lives on `groot-public-demo-context-mcp`. Either select that as the project's Production Branch or merge it into `main` and use `main`. Do not deploy the old main branch before it includes this feature and `vercel.json`.

Connect the project to GitHub rather than only uploading a local build. Pushes to the configured Production Branch trigger builds and update the stable production domain after a successful deployment. Other branches receive preview deployments according to the project's Git settings. A failed build leaves the last successful deployment live. Check the Vercel Deployments page for status and logs.

Use the production project domain as the shared link; individual deployment URLs identify a specific build. For anonymous viewing, review Vercel Deployment Protection and ensure the shared production domain is public. Configure a custom domain later if desired.

The public build opens NOVA Dental and includes only the explicitly selected bundled demos. Own-project setup still guides visitors to install the repository and enable the project-local skill and MCP in their coding agent. Vercel never reads their local workspace. Demo changes are published only after committing and pushing their source to the connected branch; local unsaved edits are not deployed.

The previous Sites URL is a separately published snapshot. A GitHub push updates Vercel only after the Git connection is configured; it does not update that earlier URL.

Verify before pushing with `pnpm build:public` and `pnpm test:public`. See [Vercel Git deployment documentation](https://vercel.com/docs/git) and [build configuration](https://vercel.com/docs/builds/configure-a-build).
