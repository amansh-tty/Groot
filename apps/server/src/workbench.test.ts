import { mkdtemp, mkdir, writeFile, readFile, rm, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, it } from 'vitest';
import { Workbench } from './workbench.js';
const cleanups: (() => Promise<void>)[] = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup();
});
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'playground-v1-'));
  const repo = fileURLToPath(new URL('../../../', import.meta.url));
  for (const folder of ['demos', 'data', 'context', 'packages/design-system/src', '.console'])
    await cp(join(repo, folder), join(root, folder), { recursive: true });
  const bench = new Workbench(root);
  await bench.start();
  cleanups.push(async () => {
    bench.close();
    await rm(root, { recursive: true, force: true });
  });
  return { root, bench };
}
it('discovers metadata without SQLite, skips malformed entries, and observes external edits', async () => {
  const { root, bench } = await fixture();
  expect((await bench.list()).demos).toHaveLength(4);
  await mkdir(join(root, 'demos/broken'));
  await writeFile(join(root, 'demos/broken/meta.json'), 'not json');
  expect((await bench.list()).warnings[0]).toContain('broken');
  const revision = bench.revision;
  await writeFile(join(root, 'demos/patient-search/README.md'), '# External edit');
  await expect.poll(() => bench.revision).toBeGreaterThan(revision);
  expect((await bench.detail('patient-search')).readme).toBe('# External edit');
});
it('creates an independent local alternative and reopens it without a database record', async () => {
  const { root, bench } = await fixture();
  const id = await bench.fork('emergency-booking-simplified', 'Alternative test');
  const detail = await bench.detail(id);
  expect(detail.meta).toMatchObject({
    parentId: 'emergency-booking-simplified',
    authorSlug: 'local-designer',
    title: 'Alternative test',
  });
  expect(detail.feedback).toEqual([]);
  await writeFile(join(root, 'demos', id, 'src/App.tsx'), '// independent');
  expect(
    await readFile(join(root, 'demos/emergency-booking-simplified/src/App.tsx'), 'utf8'),
  ).not.toBe('// independent');
  const reopened = new Workbench(root);
  await reopened.start();
  try {
    expect((await reopened.list()).demos.some((d) => d.id === id)).toBe(true);
  } finally {
    reopened.close();
  }
  await expect(bench.detail('../context')).rejects.toThrow('Invalid demo ID');
});
it('compiles real React and reports a syntax failure without overwriting source', async () => {
  const { root, bench } = await fixture();
  const first = await bench.preview('patient-search');
  expect(first.error).toBeUndefined();
  expect(first.html).toContain('Find your patient');
  const path = join(root, 'demos/patient-search/src/App.tsx');
  const original = await readFile(path, 'utf8');
  const revision = bench.revision;
  await writeFile(path, 'export default function Broken( {');
  await expect.poll(() => bench.revision).toBeGreaterThan(revision);
  expect((await bench.preview('patient-search')).error).toBeTruthy();
  expect(await readFile(path, 'utf8')).toBe('export default function Broken( {');
  await writeFile(path, original);
});

it('persists element feedback, resolves it, and refuses stale writes', async () => {
  const { root, bench } = await fixture();
  const id = 'emergency-booking-simplified';
  const before = await bench.feedback(id);
  const created = await bench.changeFeedback(id, before.version, {
    action: 'create',
    target: {
      element: 'confirm-appointment',
      elementId: 'confirm-appointment',
      screen: 'confirmation',
      state: 'default',
    },
    comment: 'Connect the action to the summary.',
  });
  const item = created.items.at(-1)!;
  expect(item.status).toBe('open');
  const file = JSON.parse(
    await readFile(join(root, 'demos', id, 'feedback/feedback.json'), 'utf8'),
  );
  expect(file.at(-1)).toMatchObject({
    elementId: 'confirm-appointment',
    prototype: id,
    comment: 'Connect the action to the summary.',
  });
  await expect(
    bench.changeFeedback(id, before.version, { action: 'delete', id: item.id }),
  ).rejects.toThrow('changed externally');
  const resolved = await bench.changeFeedback(id, created.version, {
    action: 'status',
    id: item.id,
    status: 'resolved',
  });
  expect(resolved.items.at(-1)?.resolvedAt).toBeTruthy();
  await writeFile(join(root, 'demos', id, 'feedback/feedback.json'), '{broken');
  await expect(
    bench.changeFeedback(id, resolved.version, { action: 'delete', id: item.id }),
  ).rejects.toThrow();
});

it('persists only declared controls, rejects stale or out-of-range changes, and compiles their values', async () => {
  const { root, bench } = await fixture();
  const id = 'emergency-booking-simplified';
  const before = await bench.controls(id);
  await expect(bench.changeControls(id, before.version, { 'card-gap': 500 })).rejects.toThrow();
  await expect(bench.changeControls(id, before.version, { 'arbitrary-css': 12 })).rejects.toThrow(
    'declared',
  );
  const saved = await bench.changeControls(id, before.version, { 'card-gap': 24 });
  expect(saved.document.controls.find((c) => c.id === 'card-gap')?.value).toBe(24);
  expect(
    JSON.parse(await readFile(join(root, 'demos', id, 'controls.json'), 'utf8')).controls[0].value,
  ).toBe(24);
  await expect(bench.changeControls(id, before.version, { 'card-gap': 16 })).rejects.toThrow(
    'externally',
  );
  const preview = await bench.preview(id);
  expect(preview.error).toBeUndefined();
  const source = await readFile(join(root, 'demos', id, 'src/App.tsx'), 'utf8');
  await bench.changeControls(id, saved.version, { 'card-gap': 16 });
  expect(await readFile(join(root, 'demos', id, 'src/App.tsx'), 'utf8')).toBe(source);
});
