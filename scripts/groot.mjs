import { fileURLToPath } from 'node:url';
import { realpath } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const [command, subject, ...flags] = process.argv.slice(2);
const repo = fileURLToPath(new URL('../', import.meta.url));
if (command === 'create') {
  const options = new Map();
  let valid = Boolean(subject);
  for (let index = 0; index < flags.length; index += 2) {
    const flag = flags[index];
    const value = flags[index + 1];
    if (!['--name', '--description'].includes(flag) || !value || options.has(flag)) valid = false;
    else options.set(flag, value);
  }
  if (!valid || !options.has('--name')) {
    console.error(
      'Usage: pnpm groot create <path> --name <project-name> [--description <description>]\nRun pnpm build first.',
    );
    process.exitCode = 1;
  } else {
    try {
      const { scaffoldWorkspace } = await import('../apps/server/dist/workspace-scaffold.js');
      const result = await scaffoldWorkspace(resolve(subject), {
        name: options.get('--name'),
        description: options.get('--description') ?? '',
      });
      console.log(
        `Created Groot designer workspace\n${result.path}\n${result.created.length} scaffold files created.`,
      );
    } catch (error) {
      console.error('Create failed:', error.message);
      if (error.code === 'ERR_MODULE_NOT_FOUND') console.error('Run pnpm build before creating.');
      process.exitCode = 1;
    }
  }
} else {
  const id = subject;
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
}
