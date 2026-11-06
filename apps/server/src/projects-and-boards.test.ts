import { afterEach, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, writeFile, rm, symlink, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createApp } from './app.js';
import { Projects } from './projects.js';
import { boardSchema } from './planning-boards.js';
const cleanups: (() => Promise<void>)[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  for (const cleanup of cleanups.splice(0)) await cleanup();
});
const headers = { host: '127.0.0.1:4310', origin: 'http://127.0.0.1:4310' };
it('creates separate projects and protects board, document and repository boundaries', async () => {
  const root = await mkdtemp(join(tmpdir(), 'groot-projects-'));
  const app = await createApp({ workspaceRoot: root, dataDir: join(root, '.db') });
  cleanups.push(async () => {
    await app.close();
    await rm(root, { recursive: true, force: true });
  });
  const request = (method: 'GET' | 'POST' | 'PUT', url: string, payload?: unknown) =>
    app.inject({
      method,
      url,
      headers: {
        ...headers,
        ...(payload === undefined ? {} : { 'content-type': 'application/json' }),
      },
      payload: payload === undefined ? undefined : JSON.stringify(payload),
    });
  expect((await request('GET', '/api/projects')).json().projects).toEqual([]);
  const alpha = (
    await request('POST', '/api/projects', { name: 'Alpha', repository: 'owner/alpha' })
  ).json();
  const beta = (await request('POST', '/api/projects', { name: 'Beta' })).json();
  expect(alpha.id).not.toBe(beta.id);
  const url = (path: string, id = alpha.id) => '/api' + path + '?scope=user&project=' + id;
  expect((await request('GET', url('/workspace'))).json().workspace.path).toBe(
    join(root, 'workspace/projects', alpha.id),
  );
  const created = (await request('POST', url('/boards'), { title: 'Product plan' })).json();
  const original = (await request('GET', url('/boards/' + created.id))).json();
  const board = {
    ...original.board,
    nodes: [
      { id: 'goal', x: 100, y: 100, text: 'Verified user goal' },
      { id: 'question', x: 420, y: 100, text: 'Assumption to test' },
    ],
    edges: [{ id: 'connection', from: 'goal', to: 'question' }],
  };
  expect(
    (await request('PUT', url('/boards/' + created.id), { board, version: original.version }))
      .statusCode,
  ).toBe(200);
  expect((await request('GET', url('/boards', beta.id))).json().boards).toEqual([]);
  expect((await request('GET', url('/boards/' + created.id, beta.id))).statusCode).toBe(404);
  expect(
    (await request('PUT', url('/boards/' + created.id), { board, version: original.version }))
      .statusCode,
  ).toBe(409);
  const saved = (await request('GET', url('/boards/' + created.id))).json();
  const updates = await Promise.all([
    request('PUT', url('/boards/' + created.id), {
      board: { ...board, title: 'First update' },
      version: saved.version,
    }),
    request('PUT', url('/boards/' + created.id), {
      board: { ...board, title: 'Second update' },
      version: saved.version,
    }),
  ]);
  expect(updates.map((value) => value.statusCode).sort()).toEqual([200, 409]);
  expect(
    (await request('POST', url('/files'), { title: 'Alpha notes', kind: 'note' })).statusCode,
  ).toBe(200);
  expect((await request('GET', url('/files', beta.id))).json().files).toEqual([]);
  const settings = (await request('GET', url('/project-repository', beta.id))).json();
  expect(
    (
      await request('POST', url('/project-repository', beta.id), {
        repository: 'owner/beta',
        version: settings.version,
      })
    ).statusCode,
  ).toBe(200);
  expect((await request('GET', url('/project-repository'))).json().repository).toBe('owner/alpha');
  expect(
    (
      await request('POST', url('/project-repository', beta.id), {
        repository: 'owner/wrong',
        version: settings.version,
      })
    ).statusCode,
  ).toBe(409);
  const fetchMock = vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(
      async (input) => new Response(JSON.stringify([{ url: String(input) }]), { status: 200 }),
    );
  const contributions = (await request('GET', url('/contributions', beta.id))).json();
  expect(contributions.repository).toBe('owner/beta');
  expect(fetchMock.mock.calls[0]?.[0]).toContain('/repos/owner/beta/pulls');
  expect(
    (await request('POST', '/api/boards?scope=example', { title: 'Do not edit NOVA' })).statusCode,
  ).toBe(403);
  expect((await request('GET', '/api/boards?scope=user&project=..%2Foutside')).statusCode).toBe(
    404,
  );
  const path = join(root, 'workspace/projects', alpha.id, 'demos', 'sample');
  await mkdir(join(path, 'src'), { recursive: true });
  await writeFile(
    join(path, 'meta.json'),
    JSON.stringify({ id: 'sample', title: 'Sample', platform: 'web' }),
  );
  await writeFile(join(path, 'src/App.tsx'), 'export default function App(){return null}');
  await writeFile(
    join(path, 'prompts.json'),
    JSON.stringify([{ prompt: 'Make the next step clear', createdAt: '2026-11-06T10:00:00Z' }]),
  );
  const list = (await request('GET', '/api/projects')).json().projects;
  expect(list.find((project: { id: string }) => project.id === alpha.id).latestPrompt.prompt).toBe(
    'Make the next step clear',
  );
  expect(
    JSON.parse(await readFile(join(root, 'workspace/projects', beta.id, 'project.json'), 'utf8'))
      .name,
  ).toBe('Beta');
});
it('refuses linked project directories and invalid creates without changing their targets', async () => {
  const root = await mkdtemp(join(tmpdir(), 'groot-project-links-'));
  const outside = await mkdtemp(join(tmpdir(), 'groot-project-outside-'));
  cleanups.push(async () => {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  });
  await mkdir(join(root, 'projects'));
  await writeFile(join(outside, 'project.json'), JSON.stringify({ name: 'Outside' }));
  await symlink(outside, join(root, 'projects/linked'), 'junction');
  const projects = new Projects(root);
  await expect(projects.resolve('linked')).rejects.toThrow();
  expect((await projects.list()).warnings).toHaveLength(1);
  await expect(projects.create({ name: 'Bad', unknown: 'field' })).rejects.toThrow();
  expect(JSON.parse(await readFile(join(outside, 'project.json'), 'utf8')).name).toBe('Outside');
});
it('rejects dangling connections, duplicate cards and executable fields', () => {
  const base = {
    id: 'plan',
    title: 'Plan',
    nodes: [{ id: 'one', x: 0, y: 0, text: 'Goal' }],
    edges: [],
  };
  expect(boardSchema.safeParse({ ...base, nodes: [base.nodes[0], base.nodes[0]] }).success).toBe(
    false,
  );
  expect(
    boardSchema.safeParse({ ...base, edges: [{ id: 'edge', from: 'one', to: 'missing' }] }).success,
  ).toBe(false);
  expect(boardSchema.safeParse({ ...base, script: 'anything' }).success).toBe(false);
});
