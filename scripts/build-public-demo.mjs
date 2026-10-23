import { readFile, mkdir, writeFile, readdir, lstat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { compilePrototype } from '../apps/server/dist/prototype-compiler.js';

const repo = fileURLToPath(new URL('../', import.meta.url));
const destination = join(repo, 'dist/client/demo-data');
const selections = [
  { scope: 'user', root: join(repo, 'workspace'), ids: ['spend-in-dashboard', 'design-system'] },
  {
    scope: 'example',
    root: repo,
    ids: [
      'emergency-booking',
      'emergency-booking-simplified',
      'emergency-booking-urgency-first',
      'patient-search',
    ],
  },
];
async function json(path, value) {
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, JSON.stringify(value));
}
for (const { scope, root, ids } of selections) {
  const output = join(destination, scope);
  const demos = [];
  for (const id of ids) {
    const folder = join(root, 'demos', id);
    if ((await lstat(folder)).isSymbolicLink())
      throw new Error('Public demo sources cannot be symbolic links.');
    const meta = JSON.parse(await readFile(join(folder, 'meta.json'), 'utf8'));
    if (meta.id !== id) throw new Error('Public demo metadata ID mismatch.');
    const frame = await compilePrototype(root, folder, true);
    const out = join(output, 'demos', id);
    await mkdir(out, { recursive: true });
    await writeFile(join(out, 'frame.html'), frame.html);
    await json(join(output, 'demos', id + '.json'), {
      meta,
      readme: await readFile(join(folder, 'README.md'), 'utf8').catch(() => ''),
      feedback: [],
      prompts: [],
    });
    await json(join(out, 'preview.json'), { html: 'precompiled', revision: 1 });
    await json(join(out, 'feedback.json'), { items: [], version: 'public-demo' });
    try {
      await json(join(out, 'controls.json'), {
        document: JSON.parse(await readFile(join(folder, 'controls.json'), 'utf8')),
        version: 'public-demo',
      });
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await json(join(out, 'controls.json'), { error: { message: 'No controls declared.' } });
    }
    demos.push({ ...meta, modified: '2026-10-23T00:00:00.000Z' });
  }
  await json(join(output, 'demos.json'), {
    demos,
    warnings: [],
    revision: 1,
    designer: { name: 'Demo visitor', slug: 'local-designer' },
  });
  await json(join(output, 'workspace.json'), {
    project: {
      name: scope === 'user' ? 'Spend.In demo project' : 'NOVA example project',
      description: 'Bundled interactive examples. Install Groot to work on your own project.',
    },
    legacyCount: 0,
    workspace: { mode: 'legacy', path: 'Bundled demo project', agentPath: 'Install Groot locally' },
  });
  const context = [];
  for (const entry of await readdir(join(root, 'context'), { withFileTypes: true })) {
    if (entry.isFile() && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}\.md$/.test(entry.name))
      context.push({
        name: entry.name.slice(0, -3),
        content: await readFile(join(root, 'context', entry.name), 'utf8'),
      });
  }
  await json(join(output, 'context.json'), context);
  await json(join(output, 'project-context.json'), {
    revision: 'public-demo',
    questions: [],
    answers: [],
    unanswered: [],
    complete: false,
  });
}
await mkdir(join(repo, 'dist/client/setup'), { recursive: true });
await writeFile(
  join(repo, 'dist/client/setup/SKILL.md'),
  await readFile(join(repo, 'skills/groot-setup/SKILL.md')),
);
console.log(
  'Static Groot demo built from 6 explicitly selected prototypes. No local project answers, feedback, credentials or runtime data exported.',
);
