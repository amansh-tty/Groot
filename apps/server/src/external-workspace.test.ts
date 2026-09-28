import { access, mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { createApp } from './app.js';

const cleanups: (() => Promise<void>)[] = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup();
});

it('uses an explicit external directory directly as the user workspace', async () => {
  const runtimeRoot = await mkdtemp(join(tmpdir(), 'groot-runtime-'));
  const externalRoot = await mkdtemp(join(tmpdir(), 'groot-external-'));
  const dataDir = await mkdtemp(join(tmpdir(), 'groot-data-'));
  const demo = join(externalRoot, 'demos/hello');
  await mkdir(join(demo, 'src'), { recursive: true });
  await writeFile(
    join(externalRoot, 'project.json'),
    JSON.stringify({ name: 'External product', description: 'Direct workspace fixture' }),
  );
  await writeFile(
    join(demo, 'meta.json'),
    JSON.stringify({ id: 'hello', title: 'Hello', platform: 'web' }),
  );
  await writeFile(
    join(demo, 'src/App.tsx'),
    'export default function App(){return <button>Hello external workspace</button>}',
  );

  const app = await createApp({
    workspaceRoot: runtimeRoot,
    externalWorkspaceRoot: externalRoot,
    dataDir,
  });
  cleanups.push(async () => {
    await app.close();
    await Promise.all(
      [runtimeRoot, externalRoot, dataDir].map((path) =>
        rm(path, { recursive: true, force: true }),
      ),
    );
  });
  const headers = { host: '127.0.0.1:4310' };

  expect((await app.inject({ url: '/api/workspace', headers })).json().project).toEqual({
    name: 'External product',
    description: 'Direct workspace fixture',
  });
  expect((await app.inject({ url: '/api/demos?scope=user', headers })).json().demos[0].id).toBe(
    'hello',
  );
  await expect(access(join(externalRoot, 'workspace'))).rejects.toMatchObject({ code: 'ENOENT' });
  const preview = await app.inject({ url: '/api/demos/hello/preview?scope=user', headers });
  expect(preview.statusCode).toBe(200);
  expect(preview.json().html).toContain('Hello external workspace');
  expect((await app.inject({ url: '/api/demos/hello?scope=example', headers })).statusCode).toBe(
    404,
  );
});
