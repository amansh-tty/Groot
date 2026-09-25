import { spawn } from 'node:child_process';
import { mkdtemp, rm, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import assert from 'node:assert/strict';

const dir = await mkdtemp(join(tmpdir(), 'playground-smoke-'));
const workspace = join(dir, 'workspace');
for (const folder of ['demos', 'context', 'data', 'packages/design-system/src', '.console'])
  await cp(join(process.cwd(), folder), join(workspace, folder), { recursive: true });
const origin = 'http://127.0.0.1:4312';
let child;
async function start() {
  child = spawn(process.execPath, ['apps/server/dist/index.js'], {
    env: {
      ...process.env,
      PLAYGROUND_DATA_DIR: dir,
      PLAYGROUND_WORKSPACE_ROOT: workspace,
      PLAYGROUND_PORT: '4312',
      NODE_ENV: 'production',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (data) => {
    output += data;
  });
  child.stderr.on('data', (data) => {
    output += data;
  });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error(`Server exited: ${output}`);
    try {
      const response = await fetch(`${origin}/api/health`);
      if (response.ok && output.includes('Playground app:')) return;
    } catch {
      /* server is still starting */
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Server failed to start: ${output}`);
}
async function stop() {
  if (child && child.exitCode === null) {
    const exited = once(child, 'exit');
    child.kill('SIGTERM');
    await exited;
  }
}
try {
  await start();
  const page = await fetch(origin);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Playground/);
  const saved = await fetch(`${origin}/api/settings`, {
    method: 'PUT',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify({ accent: 'blue' }),
  });
  assert.equal(saved.status, 200);
  const fork = await fetch(`${origin}/api/demos/patient-search/fork`, {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'Restart test alternative' }),
  });
  assert.equal(fork.status, 200);
  const { id } = await fork.json();
  await stop();
  await start();
  assert.deepEqual(await (await fetch(`${origin}/api/settings`)).json(), { accent: 'blue' });
  const catalog = await (await fetch(`${origin}/api/demos`)).json();
  assert.ok(
    catalog.demos.some((demo) => demo.id === id && demo.title === 'Restart test alternative'),
  );
  assert.equal((await fetch(`${origin}/.env`)).status, 404);
  console.log(
    'Production smoke passed: real HTTP, static app, filesystem alternative and settings survive process restart.',
  );
} finally {
  await stop();
  await rm(dir, { recursive: true, force: true });
}
