import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { access, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, it } from 'vitest';

const execute = promisify(execFile);
const repo = fileURLToPath(new URL('../../../', import.meta.url));
const cleanups: (() => Promise<void>)[] = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup();
});

async function runExport(args: string[]) {
  const { stdout } = await execute(
    process.execPath,
    [join(repo, 'scripts/groot.mjs'), 'export', ...args],
    {
      cwd: repo,
      windowsHide: true,
    },
  );
  const artifact = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.endsWith('prototype.html'));
  if (!artifact) throw new Error('Export command did not print an artifact path.');
  const exportRoot = join(repo, 'dist/exports');
  const rel = relative(exportRoot, artifact);
  if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('Unexpected export output path.');
  cleanups.push(() => rm(dirname(artifact), { recursive: true, force: true }));
  return artifact;
}

it('exports a thin external workspace and retains the existing example mode', async () => {
  const root = await mkdtemp(join(tmpdir(), 'groot-external-export-'));
  cleanups.push(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'design-system/src'), { recursive: true });
  await mkdir(join(root, 'demos/hello/src'), { recursive: true });
  await writeFile(join(root, 'project.json'), JSON.stringify({ name: 'External export' }));
  await writeFile(
    join(root, 'design-system/src/index.tsx'),
    'export function Badge({children}){return <strong data-thin-design-system="true">{children}</strong>}',
  );
  await writeFile(
    join(root, 'demos/hello/meta.json'),
    JSON.stringify({ id: 'hello', title: 'Hello', platform: 'web' }),
  );
  await writeFile(
    join(root, 'demos/hello/src/App.tsx'),
    'import {Badge} from "@playground/design-system"; export default function App(){return <Badge>External export works</Badge>}',
  );

  const artifact = await runExport(['hello', '--workspace', root]);
  const html = await readFile(artifact, 'utf8');
  expect(html).toContain('External export works');
  expect(html).toContain('data-thin-design-system');
  await expect(access(join(root, 'workspace'))).rejects.toMatchObject({ code: 'ENOENT' });
  await expect(access(join(root, 'packages'))).rejects.toMatchObject({ code: 'ENOENT' });

  const existingArtifact = await runExport(['emergency-booking', '--example']);
  expect(await readFile(existingArtifact, 'utf8')).toContain('Book an emergency appointment');
}, 20_000);
