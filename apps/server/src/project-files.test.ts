import { afterEach, expect, test } from 'vitest';
import { mkdtemp, readFile, writeFile, mkdir, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ProjectFiles } from './project-files.js';
const folders: string[] = [];
async function fixture() {
  const folder = await mkdtemp(join(tmpdir(), 'groot-files-'));
  folders.push(folder);
  return folder;
}
afterEach(async () => {
  await Promise.all(
    folders.splice(0).map((folder) => rm(folder, { recursive: true, force: true })),
  );
});
test('multiple file types persist independently with explicit related prototypes', async () => {
  const root = await fixture();
  const store = new ProjectFiles(root);
  const design = await store.create({
    title: 'Dashboard source',
    kind: 'design',
    url: 'https://www.figma.com/design/example',
    relatedDemoIds: ['dashboard'],
  });
  const plan = await store.create({
    title: 'Dashboard source',
    kind: 'plan',
    body: 'Goals and open questions',
  });
  expect(plan.id).not.toBe(design.id);
  expect((await new ProjectFiles(root).list()).files).toHaveLength(2);
  expect(
    JSON.parse(await readFile(join(root, 'project-files', design.id + '.json'), 'utf8'))
      .relatedDemoIds,
  ).toEqual(['dashboard']);
  expect((await new ProjectFiles(await fixture()).list()).files).toEqual([]);
});
test('invalid files are surfaced and preserved; external source URLs are constrained', async () => {
  const root = await fixture();
  const store = new ProjectFiles(root);
  await mkdir(join(root, 'project-files'));
  await writeFile(join(root, 'project-files', 'broken.json'), 'bad json');
  expect((await store.list()).warnings).toHaveLength(1);
  expect(await readFile(join(root, 'project-files', 'broken.json'), 'utf8')).toBe('bad json');
  for (const url of [
    'javascript:alert(1)',
    'file:///C:/secret',
    'https://user:password@example.com',
  ])
    await expect(store.create({ title: 'Bad source', kind: 'design', url })).rejects.toThrow();
  await expect(
    store.create({ title: 'Bad reference', kind: 'note', relatedDemoIds: ['../sibling'] }),
  ).rejects.toThrow();
});
test('linked directories and files cannot escape the selected project', async () => {
  const root = await fixture();
  const outside = await fixture();
  await mkdir(join(outside, 'project-files'));
  await symlink(join(outside, 'project-files'), join(root, 'project-files'), 'junction');
  await expect(new ProjectFiles(root).create({ title: 'No escape', kind: 'note' })).rejects.toThrow(
    'normal directory',
  );
  expect((await new ProjectFiles(outside).list()).files).toEqual([]);
});
