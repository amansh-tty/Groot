import { useState } from 'react';
import { Button } from './components/ui/button';
import { api } from './workbench-api';

export interface Project {
  name: string;
  description: string;
}
export interface WorkspaceLocation {
  mode: 'external' | 'legacy';
  path: string;
}
export function ProjectEntry({
  project,
  workspace,
}: {
  project: Project | null;
  workspace: WorkspaceLocation;
}) {
  const [copied, setCopied] = useState('');
  const createCommand = 'pnpm groot create "<workspace-path>" --name "<project-name>"';
  const openCommand = 'pnpm groot open "<workspace-path>"';
  function copy(command: string, label: string) {
    void navigator.clipboard
      .writeText(command)
      .then(() => setCopied(`${label} command copied.`))
      .catch(() => setCopied('Select the command and copy it manually.'));
  }
  return (
    <section className="project-entry" aria-labelledby="current-project-heading">
      <div className="current-project-details">
        <span className="eyebrow">CURRENT PROJECT</span>
        <h2 id="current-project-heading">{project?.name ?? 'No project is open'}</h2>
        <p>
          Groot Studio is connected to one local folder. Open this folder in your coding agent so
          its context, design system and explorations stay together.
        </p>
        <dl>
          <div>
            <dt>Workspace</dt>
            <dd>
              <code>{workspace.path}</code>
            </dd>
          </div>
          <div>
            <dt>Connection</dt>
            <dd>
              {workspace.mode === 'external' ? 'Designer project folder' : 'Built-in workspace'}
            </dd>
          </div>
        </dl>
      </div>
      <div className="project-entry-actions">
        <article>
          <h3>Create another project</h3>
          <p>Create a thin Groot project as a normal local folder.</p>
          <code>{createCommand}</code>
          <Button variant="outline" size="sm" onClick={() => copy(createCommand, 'Create')}>
            Copy create command
          </Button>
        </article>
        <article>
          <h3>Open an existing project</h3>
          <p>Start another Groot Studio process connected to that project folder.</p>
          <code>{openCommand}</code>
          <Button variant="outline" size="sm" onClick={() => copy(openCommand, 'Open')}>
            Copy open command
          </Button>
        </article>
      </div>
      <span className="project-entry-status" role="status">
        {copied}
      </span>
    </section>
  );
}
export function Orientation({
  onDismiss,
  workspace,
}: {
  onDismiss?: () => void;
  workspace?: WorkspaceLocation;
}) {
  const external = workspace?.mode === 'external';
  return (
    <section className="orientation" aria-label="Using Playground">
      <div>
        <strong>Your work, alongside your coding agent.</strong>
        <p>
          Use Explorations to interact, leave feedback, compare alternatives and tweak supported
          controls. Start Here holds your product context. Design System is where you establish
          reusable components.
        </p>
        {external ? (
          <>
            <p>
              Open the designer project folder in Codex, Claude Code or Cursor. Your agent edits
              those local files; Playground updates as you work.
            </p>
            <p>
              Designer project folder: <code>{workspace.path}</code>
            </p>
          </>
        ) : (
          <p>
            Open this repository in Codex, Claude Code or Cursor. Your agent edits local files;
            Playground updates as you work. No AI connection or account is needed here.
          </p>
        )}
      </div>
      {onDismiss && (
        <Button variant="ghost" onClick={onDismiss}>
          Dismiss orientation
        </Button>
      )}
    </section>
  );
}

export function AgentPrompt({
  kind,
  workspace,
  primary = false,
}: {
  kind: 'exploration' | 'system' | 'context';
  workspace?: WorkspaceLocation;
  primary?: boolean;
}) {
  const [copied, setCopied] = useState('');
  const external = workspace?.mode === 'external';
  const prompt = external
    ? kind === 'exploration'
      ? `Create a functional Groot product exploration.

Exploration name: [EXPLORATION NAME]
Scenario / problem: [SCENARIO / PROBLEM]
What the user needs to do: [WHAT THE USER NEEDS TO DO]

Work only inside this designer workspace.
1. Read the available project context and relevant agent instructions in this folder.
2. Use available product context under context/ when it helps the exploration.
3. Inspect and reuse available components and tokens through @playground/design-system.
4. Create the exploration under demos/<id>/ using Groot's supported exploration contract.
5. Implement meaningful interactions and important states; do not create a static mockup.
6. Keep prototype imports inside the supported workspace boundaries and avoid unnecessary workspace-owned dependencies, package.json, or node_modules.
7. When finished, report the files created or changed, implemented interactions and states, design-system usage, assumptions, and limitations.`
      : kind === 'system'
        ? 'Read project.json and relevant context files. Help me establish reusable components in design-system/src/index.tsx from the Figma, Storybook, codebase or documentation references I supply. Ask me for those references; do not assume an importer exists. Add a component showcase as an exploration in demos/.'
        : 'Read project.json. Help me document my product in context/PRODUCT.md, context/USERS.md, context/PRINCIPLES.md and context/CONSTRAINTS.md. Ask only what is needed; keep established facts separate from assumptions.'
    : kind === 'exploration'
      ? 'Read AGENTS.md and workspace/project.json, then relevant workspace/context files and skills/prototype/SKILL.md. Help me create a functional exploration for my product. Ask what experience I want to explore. Write workspace/demos/<id>/meta.json and src/App.tsx using the existing demo contract. Use workspace/data and workspace/packages/design-system only if available; otherwise use simple local styles. Do not use NOVA product facts or alter the example files.'
      : kind === 'system'
        ? 'Read workspace/project.json and relevant workspace/context files. Help me establish reusable components in workspace/packages/design-system/src from the Figma, Storybook, codebase or documentation references I supply. Ask me for those references; do not assume an importer exists. Add a component showcase as an exploration in workspace/demos using the existing demo contract. Do not copy NOVA branding or product assumptions.'
        : 'Read workspace/project.json. Help me document my product in workspace/context/PRODUCT.md, USERS.md, PRINCIPLES.md and CONSTRAINTS.md. Ask only what is needed; keep established facts separate from assumptions. Do not use NOVA context as my product context.';
  return (
    <div className="agent-prompt">
      <p>
        {external
          ? 'Copy this into your coding agent with the designer project folder open.'
          : 'Copy this into your coding agent in the same repository.'}
      </p>
      <textarea
        className="resize-none"
        aria-label="Agent prompt"
        readOnly
        value={prompt}
        rows={external && kind === 'exploration' ? 14 : 5}
      />
      <Button
        variant={primary ? 'default' : 'outline'}
        onClick={() => {
          void navigator.clipboard
            .writeText(prompt)
            .then(() => setCopied('Copied. Paste into your agent.'))
            .catch(() => setCopied('Select the prompt above and copy it manually.'));
        }}
      >
        {primary ? 'Copy starter prompt' : 'Copy agent prompt'}
      </Button>
      <span role="status">{copied}</span>
    </div>
  );
}

export function FirstExplorationHandoff({ workspace }: { workspace: WorkspaceLocation }) {
  const [pathStatus, setPathStatus] = useState('');
  return (
    <section className="first-exploration-handoff" aria-label="Create your first exploration">
      <ol>
        <li>
          <h3>Add useful product context</h3>
          <p>
            Better context can help your agent produce better explorations.{' '}
            <code>context/PRODUCT.md</code> and <code>design-system/src/index.tsx</code> are
            starting points, not requirements. Edit, replace, extend or organize your supporting
            context and agent instructions however you prefer. You can begin before either is
            complete.
          </p>
        </li>
        <li>
          <h3>Open this project folder in your coding agent</h3>
          <p>
            Use Codex, Claude Code, Cursor or another coding agent. Already have your own agent
            setup? Keep using it.
          </p>
          <div className="handoff-path">
            <code>{workspace.path}</code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void navigator.clipboard
                  .writeText(workspace.path)
                  .then(() => setPathStatus('Project folder copied.'))
                  .catch(() => setPathStatus('Select the folder path and copy it manually.'));
              }}
            >
              Copy folder path
            </Button>
          </div>
          <span className="handoff-path-status" role="status">
            {pathStatus}
          </span>
        </li>
        <li>
          <h3>Create your first exploration</h3>
          <p>
            Describe the exploration to your agent however you normally work. Groot cares about the
            resulting exploration contract, not your prompting method.
          </p>
          <span className="starter-prompt-label">OPTIONAL STARTER PROMPT</span>
          <p>New to this workflow? Replace the three bracketed placeholders and start here.</p>
          <AgentPrompt kind="exploration" workspace={workspace} primary />
        </li>
      </ol>
      <p className="handoff-next">
        Keep Groot running. When the coding agent creates the exploration, Groot discovers it
        automatically and it appears in Studio.
      </p>
    </section>
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

export function UserDesignSystem({
  onContinue,
  workspace,
}: {
  onContinue: () => void;
  workspace?: WorkspaceLocation;
}) {
  const external = workspace?.mode === 'external';
  return (
    <div className="start-page">
      <h1>Your design system</h1>
      <p>
        A design system is optional. Bring existing Figma, Storybook, codebase or documentation
        references to your coding agent, or start exploring with simple styles.
      </p>
      <p>
        Your components live in{' '}
        <code>
          {external ? 'design-system/src/index.tsx' : 'workspace/packages/design-system/src'}
        </code>
        . Ask your agent to add a component showcase to Explorations when you have components to
        review.
      </p>
      <AgentPrompt kind="system" workspace={workspace} />
      <Button variant="ghost" onClick={onContinue}>
        Continue without a design system
      </Button>
    </div>
  );
}
