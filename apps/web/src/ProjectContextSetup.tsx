import { useEffect, useState } from 'react';
import { api } from './workbench-api';
import { Button } from './components/ui/button';
export function ProjectContextSetup({ path }: { path: string }) {
  const [context, setContext] = useState<{
    answers: { questionId: string }[];
    unanswered: { id: string; question: string; required: boolean }[];
    complete: boolean;
  } | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    let active = true;
    const refresh = () =>
      api<NonNullable<typeof context>>('/project-context')
        .then((value) => {
          if (active) {
            setContext(value);
            setError('');
          }
        })
        .catch((reason: Error) => {
          if (active) setError(reason.message);
        });
    void refresh();
    const timer = setInterval(() => void refresh(), 4000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);
  const prompt = `Set up the Groot project MCP and skill for this workspace: ${path}. From the Groot app checkout, run pnpm groot setup with this project path. Merge the generated .groot/mcp.json command/args into my coding agent's project MCP settings, preserving existing servers. Help me enable/trust it and verify get_project_context. Follow .agents/skills/groot-project/SKILL.md, ask the missing questions in small groups, summarize my confirmed answers, and save_project_answers with sources and the current revision. Before every prototype, call get_prototype_brief for its scenario. Do not invent context or store secrets.`;
  return (
    <section className="project-context-setup">
      <h2>Project context &amp; agent setup</h2>
      <p>
        Connect your coding agent to this project’s context. It can ask tailored questions and reuse
        your answers when you explore a new direction.
      </p>
      {error && <p role="alert">{error}</p>}
      {context && (
        <p className="context-progress">
          {context.answers.length} recorded answers ·{' '}
          {context.unanswered.filter((item) => item.required).length} required questions remaining
        </p>
      )}
      <Button
        variant="outline"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(prompt);
            setNotice('Copied. Paste into your coding agent to configure this project.');
          } catch {
            setNotice('Copy unavailable. Select the prompt in the details below.');
          }
        }}
      >
        Copy project setup prompt
      </Button>
      <p role="status">{notice}</p>
      <details>
        <summary>Questions and configuration</summary>
        <p>
          Setup creates <code>.groot/mcp.json</code> and{' '}
          <code>.agents/skills/groot-project/SKILL.md</code>. Your client must enable the server
          before its tools can be used.
        </p>
        <ul>
          {context?.unanswered.map((item) => (
            <li key={item.id}>
              {item.question}
              {!item.required ? ' (optional)' : ''}
            </li>
          ))}
        </ul>
        <pre>{prompt}</pre>
        <p>
          Answers live in <code>context/PROJECT.json</code>; customize questions in{' '}
          <code>context/QUESTIONS.json</code>. Invalid files are preserved and reported.
        </p>
      </details>
    </section>
  );
}
