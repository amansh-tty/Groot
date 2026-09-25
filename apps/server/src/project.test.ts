import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { createApp } from './app.js';

const cleanups: (() => Promise<void>)[] = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup();
});

it('starts empty, creates one file-based project, isolates examples and reopens user prototypes', async () => {
  const root = await mkdtemp(join(tmpdir(), 'playground-project-'));
  let app = await createApp({ workspaceRoot: root, dataDir: join(root, '.db') });
  cleanups.push(async () => {
    await app.close();
    await rm(root, { recursive: true, force: true });
  });
  const headers = { host: '127.0.0.1:4310', origin: 'http://127.0.0.1:4310' };
  expect((await app.inject({ url: '/api/workspace', headers })).json().project).toBeNull();
  expect((await app.inject({ url: '/api/demos?scope=user', headers })).json().demos).toEqual([]);
  expect(
    (await app.inject({ method: 'POST', url: '/api/workspace', headers, payload: { name: '' } }))
      .statusCode,
  ).toBe(409);
  expect(
    (
      await app.inject({
        method: 'POST',
        url: '/api/workspace',
        headers,
        payload: { name: 'My product', description: 'My own context' },
      })
    ).statusCode,
  ).toBe(200);
  expect(
    (
      await app.inject({
        method: 'POST',
        url: '/api/workspace',
        headers,
        payload: { name: 'Overwrite' },
      })
    ).statusCode,
  ).toBe(409);
  expect(JSON.parse(await readFile(join(root, 'workspace/project.json'), 'utf8')).name).toBe(
    'My product',
  );
  const demo = join(root, 'workspace/demos/my-flow');
  await mkdir(join(demo, 'src'), { recursive: true });
  await writeFile(
    join(demo, 'meta.json'),
    JSON.stringify({ id: 'my-flow', title: 'My flow', platform: 'web' }),
  );
  await writeFile(
    join(demo, 'src/App.tsx'),
    'import {useState} from "react"; export default function App(){const [n,set]=useState(0);return <button onClick={()=>set(n+1)}>Count {n}</button>}',
  );
  await writeFile(join(root, 'workspace/context/PRODUCT.md'), 'User product facts');
  await writeFile(join(root, 'context/PRODUCT.md'), 'Example facts');
  expect((await app.inject({ url: '/api/demos?scope=example', headers })).json().demos).toEqual([]);
  expect((await app.inject({ url: '/api/context?scope=user', headers })).json()[0].content).toBe(
    'User product facts',
  );
  expect(
    (await app.inject({ url: '/api/demos/my-flow/preview?scope=user', headers })).json().html,
  ).toContain('Count');
  expect((await app.inject({ url: '/api/demos/my-flow?scope=example', headers })).statusCode).toBe(
    404,
  );
  await app.close();
  app = await createApp({ workspaceRoot: root, dataDir: join(root, '.db') });
  expect((await app.inject({ url: '/api/workspace', headers })).json().project.name).toBe(
    'My product',
  );
  expect((await app.inject({ url: '/api/demos?scope=user', headers })).json().demos[0].id).toBe(
    'my-flow',
  );
  await writeFile(join(root, 'workspace/project.json'), '{broken');
  expect((await app.inject({ url: '/api/workspace', headers })).statusCode).toBe(409);
});
