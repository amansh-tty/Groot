import { access, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { compilePrototype } from './prototype-compiler.js';
import { projectSchema } from './project.js';
import { scaffoldWorkspace } from './workspace-scaffold.js';

const roots: string[] = [];
afterEach(async () => {
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true });
});

async function absent(path: string) {
  await expect(access(path)).rejects.toMatchObject({ code: 'ENOENT' });
}

it('creates the thin contract and compiles a prototype without workspace dependencies', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'groot-scaffold-'));
  roots.push(parent);
  const root = join(parent, 'designer-project');
  const result = await scaffoldWorkspace(root, {
    name: 'Spend.In',
    description: 'Expense management explorations',
  });
  expect(result.path).toBe(root);
  expect(
    projectSchema.parse(JSON.parse(await readFile(join(root, 'project.json'), 'utf8'))),
  ).toEqual({ name: 'Spend.In', description: 'Expense management explorations' });
  expect(await readdir(join(root, 'demos'))).toEqual([]);
  expect(await readFile(join(root, 'AGENTS.md'), 'utf8')).toContain(
    'demos/<id>/feedback/feedback.json',
  );
  expect(await readFile(join(root, 'context/PRODUCT.md'), 'utf8')).toContain(
    '## Problem / current focus',
  );
  expect(await readFile(join(root, 'design-system/src/index.tsx'), 'utf8')).toContain(
    'export function Button',
  );
  for (const name of ['package.json', 'node_modules', 'packages', 'workspace'])
    await absent(join(root, name));

  const repeated = await scaffoldWorkspace(root, {
    name: 'Spend.In',
    description: 'Expense management explorations',
  });
  expect(repeated.created).toEqual([]);
  const demo = join(root, 'demos/hello');
  await mkdir(join(demo, 'src'), { recursive: true });
  await writeFile(
    join(demo, 'meta.json'),
    JSON.stringify({ id: 'hello', title: 'Hello', platform: 'web' }),
  );
  await writeFile(
    join(demo, 'src/App.tsx'),
    'import {Button,Card,Page} from "@playground/design-system"; export default function App(){return <Page><Card><Button>Scaffold works</Button></Card></Page>}',
  );
  const preview = await compilePrototype(root, demo);
  expect(preview.html).toContain('Scaffold works');
  expect(preview.html).toContain('#4f46e5');
});

it('validates before writing and preserves conflicting files and existing demos', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'groot-scaffold-conflict-'));
  roots.push(parent);
  const root = join(parent, 'designer-project');
  await mkdir(join(root, 'demos/existing'), { recursive: true });
  await writeFile(join(root, 'demos/existing/keep.txt'), 'designer work');
  await writeFile(join(root, 'AGENTS.md'), 'existing agent guidance');

  await expect(scaffoldWorkspace(root, { name: 'Conflict' })).rejects.toThrow(
    'conflicts with existing content: AGENTS.md',
  );
  expect(await readFile(join(root, 'AGENTS.md'), 'utf8')).toBe('existing agent guidance');
  expect(await readFile(join(root, 'demos/existing/keep.txt'), 'utf8')).toBe('designer work');
  for (const name of ['project.json', 'context', 'design-system']) await absent(join(root, name));

  await rm(join(root, 'AGENTS.md'));
  await scaffoldWorkspace(root, { name: 'Preserved demos' });
  expect(await readFile(join(root, 'demos/existing/keep.txt'), 'utf8')).toBe('designer work');
  await expect(scaffoldWorkspace(root, { name: 'Different project' })).rejects.toThrow(
    'conflicts with existing content: project.json',
  );
  expect(JSON.parse(await readFile(join(root, 'project.json'), 'utf8'))).toMatchObject({
    name: 'Preserved demos',
  });

  const invalid = join(parent, 'invalid');
  await expect(scaffoldWorkspace(invalid, { name: '' })).rejects.toThrow();
  await absent(invalid);
});
