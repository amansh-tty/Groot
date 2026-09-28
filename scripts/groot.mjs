import { fileURLToPath } from 'node:url';
import { realpath } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const [command, id, ...flags] = process.argv.slice(2);
const example = flags.length === 1 && flags[0] === '--example';
const externalWorkspace =
  flags.length === 2 && flags[0] === '--workspace' && flags[1] ? flags[1] : undefined;
if (command !== 'export' || !id || (flags.length > 0 && !example && !externalWorkspace)) {
  console.error(
    'Usage: pnpm groot export <exploration-id> [--example | --workspace <path>]\nRun pnpm build first. User explorations are read from workspace/; --example selects NOVA; --workspace selects a direct external workspace.',
  );
  process.exitCode = 1;
} else {
  try {
    const repo = fileURLToPath(new URL('../', import.meta.url));
    const { exportPrototype } = await import('../apps/server/dist/prototype-export.js');
    const scope = example ? 'example' : externalWorkspace ? 'external' : 'workspace';
    const root = externalWorkspace
      ? await realpath(resolve(externalWorkspace))
      : scope === 'example'
        ? repo
        : join(repo, 'workspace');
    if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(id)) throw new Error('Invalid exploration ID.');
    const result = await exportPrototype(
      root,
      id,
      join(repo, 'dist/exports', scope, id, String(Date.now())),
    );
    console.log(
      `Exported ${result.exploration}\n${result.path}\n${result.bytes} bytes. Open prototype.html directly, or serve it with any static HTTP server.`,
    );
  } catch (error) {
    console.error('Export failed:', error.message);
    if (error.code === 'ERR_MODULE_NOT_FOUND') console.error('Run pnpm build before exporting.');
    process.exitCode = 1;
  }
}
