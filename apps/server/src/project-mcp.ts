import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { ProjectContext, answerSchema, questionSchema } from './project-context.js';
import { realpath } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function createProjectMcp(directory: string) {
  const context = new ProjectContext(directory);
  const server = new McpServer({ name: 'groot-project', version: '1.0.0' });
  const result = async (operation: () => Promise<unknown>) => {
    try {
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(await operation(), null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: error instanceof Error ? error.message : 'Project operation failed.',
          },
        ],
      };
    }
  };
  server.registerTool(
    'get_project_context',
    {
      description:
        'Read saved project answers, configurable interview questions, missing answers and the current revision. Start onboarding here.',
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => result(() => context.snapshot()),
  );
  server.registerTool(
    'save_project_answers',
    {
      description:
        'Save designer-confirmed project answers with provenance. Pass the revision just read. Never invent answers or store secrets.',
      inputSchema: { revision: z.string(), answers: z.array(answerSchema).min(1).max(40) },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    async ({ revision, answers }) => result(() => context.saveAnswers(revision, answers)),
  );
  server.registerTool(
    'configure_project_questions',
    {
      description:
        'Configure this project’s interview questions and optional answer-dependent followups. Keep questions relevant to the product; preserve saved answers.',
      inputSchema: { revision: z.string(), questions: z.array(questionSchema).min(1).max(40) },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    async ({ revision, questions }) =>
      result(() => context.configureQuestions(revision, questions)),
  );
  server.registerTool(
    'get_prototype_brief',
    {
      description:
        'Required before creating or changing a prototype: cross-reference the scenario with saved answers and relevant local Markdown context. Return missing questions, assumptions and a revision for source attribution.',
      inputSchema: { scenario: z.string().trim().min(3).max(2000) },
      annotations: { readOnlyHint: true },
    },
    async ({ scenario }) => result(() => context.brief(scenario)),
  );
  return server;
}
export async function startProjectMcp(root: string) {
  await createProjectMcp(await realpath(resolve(root))).connect(new StdioServerTransport());
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--workspace')
    throw new Error('Usage: node project-mcp.js --workspace <project-root>');
  const root = await realpath(resolve(args[1]!));
  await createProjectMcp(root).connect(new StdioServerTransport());
}
