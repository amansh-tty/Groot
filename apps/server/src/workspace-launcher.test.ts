import { access, mkdtemp, mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { scaffoldWorkspace } from './workspace-scaffold.js';
import { prepareStudioLaunch, validateDesignerWorkspace } from './workspace-launcher.js';

const roots: string[] = [];
afterEach(async () => {
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true });
});

async function temporaryPath(name: string) {
  const parent = await mkdtemp(join(tmpdir(), 'groot-open-'));
  roots.push(parent);
  return join(parent, name);
}

it('validates a scaffolded workspace and prepares the inherited child environment', async () => {
  const root = await temporaryPath('designer-workspace');
  await scaffoldWorkspace(root, { name: 'Launch test' });
  const before = await readFile(join(root, 'project.json'), 'utf8');
  const launch = await prepareStudioLaunch(join(root, '.'), {
    repoRoot: 'C:\\groot',
    environment: { EXISTING_VALUE: 'preserved' },
    packageManagerPath: 'C:\\pnpm\\pnpm.cjs',
  });

  expect(launch.workspace).toEqual({
    path: await realpath(root),
    project: { name: 'Launch test', description: '' },
  });
  expect(launch.command).toBe(process.execPath);
  expect(launch.args).toEqual(['C:\\pnpm\\pnpm.cjs', 'dev']);
  expect(launch.options).toMatchObject({
    cwd: 'C:\\groot',
    stdio: 'inherit',
    env: {
      EXISTING_VALUE: 'preserved',
      PLAYGROUND_EXTERNAL_WORKSPACE_ROOT: await realpath(root),
    },
  });
  expect(await readFile(join(root, 'project.json'), 'utf8')).toBe(before);
  await expect(access(join(root, 'workspace'))).rejects.toMatchObject({ code: 'ENOENT' });
});

it('rejects missing and invalid workspace paths without writing files', async () => {
  await expect(validateDesignerWorkspace('')).rejects.toThrow('Workspace path is required');

  const missing = await temporaryPath('missing');
  await expect(validateDesignerWorkspace(missing)).rejects.toThrow(
    `Workspace does not exist: ${missing}`,
  );
  await expect(access(missing)).rejects.toMatchObject({ code: 'ENOENT' });

  const file = await temporaryPath('file.txt');
  await writeFile(file, 'not a workspace');
  await expect(validateDesignerWorkspace(file)).rejects.toThrow(
    `Workspace is not a directory: ${file}`,
  );

  const noProject = await temporaryPath('no-project');
  await mkdir(noProject);
  await expect(validateDesignerWorkspace(noProject)).rejects.toThrow(
    `Workspace is missing project.json: ${join(noProject, 'project.json')}`,
  );
  expect(await access(noProject)).toBeUndefined();

  const invalid = await temporaryPath('invalid-project');
  await mkdir(invalid);
  await writeFile(join(invalid, 'project.json'), JSON.stringify({ name: '', extra: true }));
  await expect(validateDesignerWorkspace(invalid)).rejects.toThrow(
    `Workspace project.json is invalid: ${join(invalid, 'project.json')}`,
  );
});
