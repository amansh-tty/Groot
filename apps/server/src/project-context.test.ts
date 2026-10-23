import { afterEach, expect, test } from 'vitest';
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ProjectContext } from './project-context.js';
import { prepareProjectSetup } from './project-setup.js';
import { createProjectMcp } from './project-mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

const folders: string[] = [];
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'groot-context-'));
  folders.push(root);
  return root;
}
afterEach(async () => {
  await Promise.all(folders.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});
test('context retains provenance, rejects stale saves, and isolates projects', async () => {
  const root = await fixture();
  const context = new ProjectContext(root);
  const initial = await context.snapshot();
  const saved = await context.saveAnswers(initial.revision, [
    {
      questionId: 'product',
      value: 'Expense approval',
      kind: 'fact',
      source: 'Designer interview',
    },
  ]);
  expect(saved.answers[0]).toMatchObject({
    value: 'Expense approval',
    source: 'Designer interview',
    kind: 'fact',
  });
  await expect(
    context.saveAnswers(initial.revision, [{ questionId: 'users', value: 'Staff', kind: 'fact' }]),
  ).rejects.toThrow('changed');
  expect((await new ProjectContext(await fixture()).snapshot()).answers).toEqual([]);
  await mkdir(join(root, 'context'), { recursive: true });
  await writeFile(
    join(root, 'context', 'POLICY.md'),
    'Expense policy: approval requires a receipt.',
  );
  const first = await context.brief('Expense approval');
  expect(first.documents[0]?.content).toContain('receipt');
  await writeFile(
    join(root, 'context', 'POLICY.md'),
    'Expense policy: approval requires two receipts.',
  );
  expect((await context.brief('Expense approval')).revision).not.toBe(first.revision);
});
test('conditional interview questions activate from confirmed answers and reject cycles', async () => {
  const context = new ProjectContext(await fixture());
  const current = await context.snapshot();
  const configured = await context.configureQuestions(current.revision, [
    { id: 'product', question: 'What is your product?' },
    {
      id: 'health',
      question: 'Which health data must stay fictional?',
      when: { questionId: 'product', includes: 'health' },
    },
  ]);
  expect(configured.unanswered.map((q) => q.id)).toEqual(['product']);
  const saved = await context.saveAnswers(configured.revision, [
    { questionId: 'product', value: 'Healthcare scheduling', kind: 'decision' },
  ]);
  expect(saved.unanswered.map((q) => q.id)).toEqual(['health']);
  await expect(
    context.configureQuestions(saved.revision, [
      { id: 'first', question: 'First question', when: { questionId: 'second', includes: 'yes' } },
      { id: 'second', question: 'Second question', when: { questionId: 'first', includes: 'yes' } },
    ]),
  ).rejects.toThrow('earlier');
});
test('invalid existing data and linked context are preserved and refused', async () => {
  const root = await fixture();
  await mkdir(join(root, 'context'));
  await writeFile(join(root, 'context', 'PROJECT.json'), 'broken');
  await expect(new ProjectContext(root).snapshot()).rejects.toThrow();
  expect(await readFile(join(root, 'context', 'PROJECT.json'), 'utf8')).toBe('broken');
  const linked = await fixture();
  await symlink(join(root, 'context'), join(linked, 'context'), 'junction');
  await expect(new ProjectContext(linked).snapshot()).rejects.toThrow('normal directory');
});
test('setup preserves instructions, is repeatable, and refuses conflicting configuration', async () => {
  const root = await fixture();
  const repo = await fixture();
  await writeFile(join(root, 'project.json'), JSON.stringify({ name: 'Test project' }));
  await writeFile(join(root, 'AGENTS.md'), 'Existing project instructions\n');
  await mkdir(join(repo, 'apps/server/dist'), { recursive: true });
  await writeFile(join(repo, 'apps/server/dist/project-mcp.js'), '');
  const first = await prepareProjectSetup(root, repo);
  expect(first.config.mcpServers['groot-project'].args).toContain(root);
  expect((await prepareProjectSetup(root, repo)).created).toEqual([]);
  expect(await readFile(join(root, 'AGENTS.md'), 'utf8')).toContain(
    'Existing project instructions',
  );
  await writeFile(join(root, '.groot/mcp.json'), 'existing custom config');
  await expect(prepareProjectSetup(root, repo)).rejects.toThrow('replace existing configuration');
  expect(await readFile(join(root, '.groot/mcp.json'), 'utf8')).toBe('existing custom config');
});
test('real MCP client can interview, save and retrieve a scenario brief', async () => {
  const server = createProjectMcp(await fixture());
  const client = new Client({ name: 'groot-test', version: '1.0.0' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(a), client.connect(b)]);
  try {
    expect((await client.listTools()).tools.map((t) => t.name)).toEqual([
      'get_project_context',
      'save_project_answers',
      'configure_project_questions',
      'get_prototype_brief',
    ]);
    const result = await client.callTool({ name: 'get_project_context', arguments: {} });
    const content = result.content as { type: string; text: string }[];
    const snapshot = JSON.parse(content[0]!.text);
    const saved = await client.callTool({
      name: 'save_project_answers',
      arguments: {
        revision: snapshot.revision,
        answers: [
          {
            questionId: 'product',
            value: 'Expense approval',
            kind: 'fact',
            source: 'Test designer',
          },
        ],
      },
    });
    expect(saved.isError).not.toBe(true);
    const brief = await client.callTool({
      name: 'get_prototype_brief',
      arguments: { scenario: 'Expense approval flow' },
    });
    expect(JSON.stringify(brief.content)).toContain('Expense approval');
  } finally {
    await client.close();
    await server.close();
  }
});
