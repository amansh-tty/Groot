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
  const externalDesignSystem = join(externalRoot, 'design-system/src');
  const legacyDemo = join(runtimeRoot, 'demos/legacy');
  const legacyDesignSystem = join(runtimeRoot, 'packages/design-system/src');
  await mkdir(join(demo, 'src'), { recursive: true });
  await mkdir(externalDesignSystem, { recursive: true });
  await mkdir(join(legacyDemo, 'src'), { recursive: true });
  await mkdir(legacyDesignSystem, { recursive: true });
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
    'import {Badge} from "@playground/design-system"; export default function App(){return <Badge>Hello external workspace</Badge>}',
  );
  await writeFile(
    join(externalDesignSystem, 'index.tsx'),
    'export function Badge({children}:{children:React.ReactNode}){return <strong data-design-system="external">{children}</strong>}',
  );
  await writeFile(
    join(legacyDemo, 'meta.json'),
    JSON.stringify({ id: 'legacy', title: 'Legacy', platform: 'web' }),
  );
  await writeFile(
    join(legacyDemo, 'src/App.tsx'),
    'import {Badge} from "@playground/design-system"; export default function App(){return <Badge>Legacy design system</Badge>}',
  );
  await writeFile(
    join(legacyDesignSystem, 'index.tsx'),
    'export function Badge({children}:{children:React.ReactNode}){return <strong data-design-system="legacy">{children}</strong>}',
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
  expect(preview.json().html).toContain('data-design-system');
  await expect(access(join(externalRoot, 'packages'))).rejects.toMatchObject({ code: 'ENOENT' });
  expect((await app.inject({ url: '/api/demos/hello?scope=example', headers })).statusCode).toBe(
    404,
  );
  const legacyPreview = await app.inject({
    url: '/api/demos/legacy/preview?scope=example',
    headers,
  });
  expect(legacyPreview.statusCode).toBe(200);
  expect(legacyPreview.json().html).toContain('Legacy design system');
});
