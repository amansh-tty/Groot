import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { readConfig } from './config.js';

const config = readConfig();
// Both src/ and dist/ sit at this depth. Production serves only the web build.
const built = import.meta.url.endsWith('/dist/index.js');
const staticRoot = fileURLToPath(new URL('../../web/dist/', import.meta.url));
if (built && !existsSync(new URL('../../web/dist/index.html', import.meta.url))) {
  throw new Error('Web build missing. Run pnpm build before pnpm start.');
}
const app = await createApp({
  ...config,
  development: !built && !config.production,
  staticRoot: built ? staticRoot : undefined,
  workspaceRoot:
    process.env.PLAYGROUND_WORKSPACE_ROOT ?? fileURLToPath(new URL('../../../', import.meta.url)),
});
try {
  await app.listen({ host: '127.0.0.1', port: config.port });
  console.log(`Playground ${built ? 'app' : 'API'}: http://127.0.0.1:${config.port}`);
  console.log(`Local data: ${config.dataDir}`);
} catch (error) {
  await app.close();
  throw error;
}
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void app.close().then(() => process.exit(0));
  });
}
