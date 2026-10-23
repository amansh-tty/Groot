import { useEffect, useState } from 'react';
import { ArrowUpRight, BookOpen, Check, Copy, FileText, FolderOpen } from 'lucide-react';
import { api, publicDemo, requestLocalSetup } from './workbench-api';
import { ProjectContextSetup } from './ProjectContextSetup';
import { Button } from './components/ui/button';
import {
  AgentPrompt,
  FirstExplorationHandoff,
  ProjectEntry,
  type Project,
  type WorkspaceLocation,
} from './WorkspaceWelcome';

export function ProjectGuide({
  project,
  workspace,
  revision,
  example,
}: {
  project: Project | null;
  workspace: WorkspaceLocation;
  revision: number;
  example: boolean;
}) {
  const [documents, setDocuments] = useState<{ name: string; content: string }[]>([]);
  const [selected, setSelected] = useState('guide');
  const [error, setError] = useState('');
  const [copy, setCopy] = useState('');
  const agentPath = workspace.agentPath ?? workspace.path;
  useEffect(() => {
    let current = true;
    api<typeof documents>('/context')
      .then((value) => {
        if (current) {
          setDocuments(value);
          setError('');
        }
      })
      .catch((reason: Error) => {
        if (current) setError(reason.message);
      });
    return () => {
      current = false;
    };
  }, [revision]);
  return (
    <div className="guide-layout">
      <aside className="project-panel">
        <div className="panel-heading">
          <BookOpen size={14} />
          <h2>Start Here</h2>
        </div>
        <nav className="document-nav" aria-label="Product context">
          <button
            aria-current={selected === 'guide' ? 'page' : undefined}
            onClick={() => setSelected('guide')}
          >
            <FolderOpen size={14} />
            Using Groot
          </button>
          <span className="section-label">
            Project context <b>{documents.length}</b>
          </span>
          {documents.map((doc) => (
            <button
              key={doc.name}
              aria-current={selected === doc.name ? 'page' : undefined}
              onClick={() => setSelected(doc.name)}
            >
              <FileText size={14} />
              {doc.name.charAt(0) + doc.name.slice(1).toLowerCase()}
            </button>
          ))}
        </nav>
        <p className="panel-hint">
          Context comes from this project’s files. Prototype-specific assumptions stay with each
          exploration.
        </p>
      </aside>
      <article className="guide-content">
        {error && (
          <p role="alert" className="preview-error">
            {error}
          </p>
        )}
        {selected !== 'guide' ? (
          <>
            <span className="section-label">Project source · Read only</span>
            <h1>{selected.charAt(0) + selected.slice(1).toLowerCase()}</h1>
            <pre className="context-document">
              {documents.find((doc) => doc.name === selected)?.content ??
                'This document is no longer available. Select another context file.'}
            </pre>
          </>
        ) : (
          <>
            <span className="section-label">A local workbench. Your own agent.</span>
            <h1>One project. A place to explore it.</h1>
            <p className="guide-lead">
              Describe a direction to your coding agent. Save the files. Try the result here.
            </p>
            <div className="guide-project">
              <div>
                <span className="section-label">Current project</span>
                <h2>{project?.name ?? (example ? 'NOVA DENTAL' : 'Your workspace')}</h2>
                <p>
                  {project?.description ||
                    (example
                      ? 'Separate fictional example project.'
                      : 'Your context, components, and explorations stay together.')}
                </p>
              </div>
              <span className="quiet-badge">{example ? 'Example project' : 'Local project'}</span>
            </div>
            {publicDemo && <Button onClick={requestLocalSetup}>Use Groot with your project</Button>}
            {!publicDemo && (
              <ol className="guide-steps">
                <li>
                  <h2>Open the same project in your agent</h2>
                  <p>
                    Groot reads the folder your agent edits. There is no chat or AI account to
                    connect here.
                  </p>
                  <div className="folder-path">
                    <code>{agentPath || 'This repository'}</code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        void navigator.clipboard
                          .writeText(agentPath)
                          .then(() => setCopy('Folder path copied.'))
                          .catch(() => setCopy('Select the folder path and copy it manually.'));
                      }}
                    >
                      {copy.startsWith('Folder path') ? <Check /> : <Copy />}Copy folder path
                    </Button>
                  </div>
                  <span role="status" className="copy-status">
                    {copy}
                  </span>
                </li>
                <li>
                  <h2>Give your agent a bounded direction</h2>
                  <p>
                    Use the project context and its own components. Ask the agent to record
                    assumptions and keep missing behavior explicit.
                  </p>
                  <details>
                    <summary>
                      Get an exploration prompt <ArrowUpRight size={13} />
                    </summary>
                    <AgentPrompt kind="exploration" workspace={workspace} />
                  </details>
                </li>
                <li>
                  <h2>Try, review, and take another direction</h2>
                  <p>
                    Successful edits refresh automatically. If a build fails, your last working
                    preview stays available. Use Comment to attach feedback and Create alternative
                    to preserve the original.
                  </p>
                  <p className="evidence-note">
                    You decide when feedback is resolved. Alternatives start with empty feedback and
                    remember their parent.
                  </p>
                </li>
              </ol>
            )}
            {!publicDemo && project && <ProjectContextSetup path={workspace.path} />}
            {!publicDemo && (
              <details className="technical-help">
                <summary>Project files and setup</summary>
                <ProjectEntry project={project} workspace={workspace} />
                {workspace.mode === 'external' && <FirstExplorationHandoff workspace={workspace} />}
              </details>
            )}
          </>
        )}
      </article>
    </div>
  );
}
