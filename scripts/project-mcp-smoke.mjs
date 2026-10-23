import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
const repo = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(new URL('../apps/server/package.json', import.meta.url));
const { Client } = await import(
  pathToFileURL(require.resolve('@modelcontextprotocol/sdk/client/index.js')).href
);
const { StdioClientTransport } = await import(
  pathToFileURL(require.resolve('@modelcontextprotocol/sdk/client/stdio.js')).href
);
const parent = await mkdtemp(join(tmpdir(), 'groot-setup-smoke-'));
const project = join(parent, 'my-project');
let client;
try {
  const cli = join(repo, 'scripts/groot.mjs');
  execFileSync(process.execPath, [cli, 'create', project, '--name', 'MCP test project'], {
    cwd: repo,
  });
  execFileSync(process.execPath, [cli, 'setup', project], { cwd: repo });
  execFileSync(process.execPath, [cli, 'setup', project], { cwd: repo });
  const config = JSON.parse(await readFile(join(project, '.groot/mcp.json'), 'utf8')).mcpServers[
    'groot-project'
  ];
  const transport = new StdioClientTransport({ ...config, stderr: 'pipe' });
  client = new Client({ name: 'groot-setup-validation', version: '1.0.0' });
  await client.connect(transport);
  const unpack = (result) => {
    assert.notEqual(result.isError, true);
    return JSON.parse(result.content[0].text);
  };
  const context = unpack(await client.callTool({ name: 'get_project_context', arguments: {} }));
  const answers = context.questions.map((q) => ({
    questionId: q.id,
    value: 'Fictional test answer for ' + q.id,
    kind: 'decision',
    source: 'Setup smoke test',
  }));
  const saved = unpack(
    await client.callTool({
      name: 'save_project_answers',
      arguments: { revision: context.revision, answers },
    }),
  );
  assert.equal(saved.complete, true);
  const brief = unpack(
    await client.callTool({
      name: 'get_prototype_brief',
      arguments: { scenario: 'Scheduling exploration' },
    }),
  );
  assert.equal(brief.answers.length, answers.length);
  assert.equal(brief.complete, true);
  assert.equal(
    JSON.parse(await readFile(join(project, 'context/PROJECT.json'), 'utf8')).answers.length,
    answers.length,
  );
  console.log(
    'Local onboarding passed: create, repeatable setup, generated MCP command, real stdio client, saved context and prototype brief.',
  );
} finally {
  await client?.close();
  await rm(parent, { recursive: true, force: true });
}
