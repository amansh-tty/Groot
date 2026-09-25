import { useState } from 'react';
import { Button } from './components/ui/button';
import { api } from './workbench-api';

export interface Project {
  name: string;
  description: string;
}
export function Orientation({ onDismiss }: { onDismiss?: () => void }) {
  return (
    <section className="orientation" aria-label="Using Playground">
      <div>
        <strong>Your work, alongside your coding agent.</strong>
        <p>
          Use Explorations to interact, leave feedback, compare alternatives and tweak supported
          controls. Start Here holds your product context. Design System is where you establish
          reusable components.
        </p>
        <p>
          Open this repository in Codex, Claude Code or Cursor. Your agent edits local files;
          Playground updates as you work. No AI connection or account is needed here.
        </p>
      </div>
      {onDismiss && (
        <Button variant="ghost" onClick={onDismiss}>
          Dismiss orientation
        </Button>
      )}
    </section>
  );
}

export function AgentPrompt({ kind }: { kind: 'exploration' | 'system' | 'context' }) {
  const [copied, setCopied] = useState('');
  const prompt =
    kind === 'exploration'
      ? 'Read AGENTS.md and workspace/project.json, then relevant workspace/context files and skills/prototype/SKILL.md. Help me create a functional exploration for my product. Ask what experience I want to explore. Write workspace/demos/<id>/meta.json and src/App.tsx using the existing demo contract. Use workspace/data and workspace/packages/design-system only if available; otherwise use simple local styles. Do not use NOVA product facts or alter the example files.'
      : kind === 'system'
        ? 'Read workspace/project.json and relevant workspace/context files. Help me establish reusable components in workspace/packages/design-system/src from the Figma, Storybook, codebase or documentation references I supply. Ask me for those references; do not assume an importer exists. Add a component showcase as an exploration in workspace/demos using the existing demo contract. Do not copy NOVA branding or product assumptions.'
        : 'Read workspace/project.json. Help me document my product in workspace/context/PRODUCT.md, USERS.md, PRINCIPLES.md and CONSTRAINTS.md. Ask only what is needed; keep established facts separate from assumptions. Do not use NOVA context as my product context.';
  return (
    <div className="agent-prompt">
      <p>Copy this into your coding agent in the same repository.</p>
      <textarea
        className="resize-none"
        aria-label="Agent prompt"
        readOnly
        value={prompt}
        rows={5}
      />
      <Button
        variant="outline"
        onClick={() => {
          void navigator.clipboard
            .writeText(prompt)
            .then(() => setCopied('Copied. Paste into your agent.'))
            .catch(() => setCopied('Select the prompt above and copy it manually.'));
        }}
      >
        Copy agent prompt
      </Button>
      <span role="status">{copied}</span>
    </div>
  );
}

export function CreateProject({ onCreated }: { onCreated: (project: Project) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  return (
    <section className="workspace-welcome">
      <span className="eyebrow">YOUR LOCAL WORKSPACE</span>
      <h1>A place for your next exploration.</h1>
      <p>Start with your product. Add context and a design system whenever you need them.</p>
      {!editing ? (
        <Button onClick={() => setEditing(true)}>Start your project</Button>
      ) : (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) {
              setError('Enter a project name.');
              document.getElementById('project-name')?.focus();
              return;
            }
            setSaving(true);
            setError('');
            void api<Project>('/workspace', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, description }),
            })
              .then(onCreated)
              .catch((e) => setError(e.message))
              .finally(() => setSaving(false));
          }}
        >
          <label htmlFor="project-name">Project name</label>
          <input
            id="project-name"
            autoFocus
            value={name}
            maxLength={100}
            aria-invalid={!!error}
            aria-describedby={error ? 'project-error' : undefined}
            onChange={(e) => setName(e.target.value)}
          />
          <label htmlFor="project-description">Description (optional)</label>
          <textarea
            className="resize-none"
            id="project-description"
            rows={3}
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {error && (
            <p id="project-error" role="alert">
              {error}
            </p>
          )}
          <div className="welcome-actions">
            <Button disabled={saving} type="submit">
              {saving ? 'Creating…' : 'Create project'}
            </Button>
            <Button variant="ghost" disabled={saving} onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
      <p>
        <a href="?example=nova">Explore NOVA — Example Project</a>
      </p>
    </section>
  );
}

export function UserDesignSystem({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="start-page">
      <h1>Your design system</h1>
      <p>
        A design system is optional. Bring existing Figma, Storybook, codebase or documentation
        references to your coding agent, or start exploring with simple styles.
      </p>
      <p>
        Your components live in <code>workspace/packages/design-system/src</code>. Ask your agent to
        add a component showcase to Explorations when you have components to review.
      </p>
      <AgentPrompt kind="system" />
      <Button variant="ghost" onClick={onContinue}>
        Continue without a design system
      </Button>
    </div>
  );
}
