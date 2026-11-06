import { useEffect, useRef, useState } from 'react';
import {
  Clock3,
  FolderOpen,
  Plus,
  Search,
  Gauge,
  ArrowUpRight,
  LayoutDashboard,
  StickyNote,
} from 'lucide-react';
import { api, publicDemo, requestLocalSetup } from './workbench-api';
import { App } from './StudioApp';
import { PlanningBoard } from './PlanningBoard';
import { Button } from './components/ui/button';
import { Dialog } from './components/ui/dialog';
import { LocalSetup } from './LocalSetup';
import { LiveThumbnail } from './LiveThumbnail';
import { PromptExcerpt } from './PromptExcerpt';
import { AgentAllowance, ProjectContributions } from './HomeActivity';

type ProjectSummary = {
  id: string;
  name: string;
  description: string;
  repository: string;
  modified: string;
  latestPrompt: { prompt: string; createdAt: string } | null;
  prototypeCount: number;
  boardCount: number | null;
  cover: { id: string; title: string; platform: 'web' | 'mobile' } | null;
};
export function projectUrl(id: string, hash = 'page=all') {
  return (id === 'nova' ? '/?example=nova' : '/?project=' + encodeURIComponent(id)) + '#' + hash;
}
export function RootApp() {
  const [hash, setHash] = useState(location.hash);
  const dirty = useRef(false);
  const previous = useRef(location.hash);
  useEffect(() => {
    const change = () => {
      if (dirty.current) {
        history.replaceState(null, '', location.pathname + location.search + previous.current);
        window.dispatchEvent(new Event('groot:board-navigation-blocked'));
        return;
      }
      previous.current = location.hash;
      setHash(location.hash);
    };
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  const query = new URLSearchParams(location.search);
  const home = query.has('home') || (!location.search && !location.hash);
  const board = new URLSearchParams(hash.slice(1)).get('board');
  return home ? (
    <ProjectHome />
  ) : board ? (
    <PlanningBoard
      key={board}
      id={board}
      onDraftChange={(value) => {
        dirty.current = value;
      }}
    />
  ) : (
    <App />
  );
}

function recentProjects(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem('groot:recent-projects') ?? '[]');
    return Array.isArray(value)
      ? value.filter((id): id is string => typeof id === 'string').slice(0, 20)
      : [];
  } catch {
    return [];
  }
}
export function visitProject(id: string) {
  try {
    localStorage.setItem(
      'groot:recent-projects',
      JSON.stringify([id, ...recentProjects().filter((value) => value !== id)].slice(0, 20)),
    );
  } catch {
    /* Storage may be disabled. Navigation still works. */
  }
  location.assign(projectUrl(id));
}

function ProjectHome() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('projects');
  const [recent] = useState(recentProjects);
  const [creating, setCreating] = useState(false);
  const [allowance, setAllowance] = useState(false);
  const [setup, setSetup] = useState(false);
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    document.title = 'Home — Groot';
    const open = () => {
      setAllowance(false);
      setSetup(true);
    };
    window.addEventListener('groot:local-setup', open);
    return () => window.removeEventListener('groot:local-setup', open);
  }, []);
  useEffect(() => {
    let current = true;
    const read = () =>
      api<{ projects: ProjectSummary[]; warnings: string[] }>('/projects')
        .then((value) => {
          if (current) {
            setProjects(value.projects);
            setWarnings(value.warnings);
            setLoaded(true);
            setError('');
          }
        })
        .catch((reason: Error) => {
          if (current) setError(reason.message);
        });
    void read();
    const timer = publicDemo ? undefined : setInterval(() => void read(), 10000);
    return () => {
      current = false;
      clearInterval(timer);
    };
  }, [refresh]);
  const visible = projects
    .filter(
      (project) =>
        (tab !== 'recent' || recent.includes(project.id)) &&
        (project.name + ' ' + project.description).toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      tab === 'recent'
        ? recent.indexOf(a.id) - recent.indexOf(b.id)
        : b.modified.localeCompare(a.modified),
    );
  return (
    <div className="projects-home">
      <a className="skip-link" href="#projects-main">
        Skip to projects
      </a>
      <header className="projects-home-bar">
        <a className="groot-wordmark" href="/?home=1">
          Groot<span>Local design workspace</span>
        </a>
        <label className="projects-home-search">
          <Search size={17} />
          <input
            aria-label="Search projects"
            placeholder="Search your projects…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <Button variant="ghost" onClick={() => setAllowance(true)}>
          <Gauge size={16} />
          Allowance
        </Button>
      </header>
      <main id="projects-main" tabIndex={-1}>
        <header className="projects-home-heading">
          <div>
            <span className="section-label">Your workspace</span>
            <h1>Projects</h1>
          </div>
          <div className="projects-create-actions">
            <Button
              variant="outline"
              onClick={() => (publicDemo ? requestLocalSetup() : setCreatingBoard(true))}
            >
              <StickyNote size={16} />
              Planning board
            </Button>
            <Button onClick={() => (publicDemo ? requestLocalSetup() : setCreating(true))}>
              <Plus size={17} />
              New project
            </Button>
          </div>
        </header>
        {publicDemo && (
          <div className="public-projects-note">
            <span>Explore the bundled projects. Your own work stays local.</span>
            <button onClick={requestLocalSetup}>
              Use my own project
              <ArrowUpRight size={14} />
            </button>
          </div>
        )}
        <div className="projects-home-filter">
          <nav aria-label="Project views">
            <button
              aria-current={tab === 'projects' ? 'page' : undefined}
              onClick={() => setTab('projects')}
            >
              <FolderOpen size={16} />
              Projects <span>{projects.length}</span>
            </button>
            <button
              aria-current={tab === 'recent' ? 'page' : undefined}
              onClick={() => setTab('recent')}
            >
              <Clock3 size={16} />
              Recents
            </button>
          </nav>
          <span>
            {visible.length} {visible.length === 1 ? 'project' : 'projects'}
          </span>
        </div>
        {error && (
          <p role="alert">
            {error} <button onClick={() => setRefresh((value) => value + 1)}>Retry</button>
          </p>
        )}
        {!!warnings.length && (
          <details>
            <summary>Project notices ({warnings.length})</summary>
            {warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </details>
        )}
        {!loaded && !error ? (
          <p role="status">Reading projects…</p>
        ) : (
          <div className="projects-grid">
            {visible.map((project) => (
              <article className="project-cover-card" key={project.id}>
                <button
                  className="project-cover-open"
                  aria-label={'Open project ' + project.name}
                  onClick={() => visitProject(project.id)}
                >
                  {project.cover ? (
                    <LiveThumbnail
                      demo={project.cover}
                      revision={Date.parse(project.modified) || 1}
                      projectId={project.id}
                    />
                  ) : (
                    <div className="empty-project-cover">
                      <LayoutDashboard size={34} />
                      <span>No prototypes yet</span>
                    </div>
                  )}
                </button>
                <div className="project-cover-info">
                  <div>
                    <button onClick={() => visitProject(project.id)}>
                      <h2>{project.name}</h2>
                    </button>
                    <span>
                      {project.prototypeCount}{' '}
                      {project.prototypeCount === 1 ? 'exploration' : 'explorations'}
                      {project.boardCount
                        ? ' · ' +
                          project.boardCount +
                          ' ' +
                          (project.boardCount === 1 ? 'board' : 'boards')
                        : ''}
                    </span>
                  </div>
                  <p>{project.description || 'No project description'}</p>
                  {project.latestPrompt ? (
                    <PromptExcerpt
                      title={project.name}
                      text={project.latestPrompt.prompt}
                      label="Latest prompt"
                    />
                  ) : (
                    <span className="project-no-prompt">No saved prompt available</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
        {loaded && !visible.length && (
          <div className="projects-empty">
            <FolderOpen size={28} />
            <h2>
              {search
                ? 'No matching projects'
                : tab === 'recent'
                  ? 'Your recently opened projects appear here'
                  : 'Start your first project'}
            </h2>
            <p>
              {search
                ? 'Try another project name.'
                : 'Keep its context, planning boards and explorations together.'}
            </p>
            {tab === 'projects' && !search && (
              <Button onClick={() => (publicDemo ? requestLocalSetup() : setCreating(true))}>
                New project
              </Button>
            )}
          </div>
        )}
        {projects.length > 0 && (
          <section
            className="projects-contribution-list"
            aria-labelledby="project-contribution-heading"
          >
            <header>
              <h2 id="project-contribution-heading">Contributions by project</h2>
              <span>Activity from each linked repository</span>
            </header>
            {projects.map((project) => (
              <div key={project.id}>
                <button onClick={() => visitProject(project.id)}>{project.name}</button>
                <ProjectContributions
                  repository={project.repository}
                  projectId={project.id}
                  compact
                />
              </div>
            ))}
          </section>
        )}
      </main>
      {creating && <NewProject onClose={() => setCreating(false)} />}
      {creatingBoard && (
        <NewBoard
          projects={projects.filter((project) => project.id !== 'nova')}
          onClose={() => setCreatingBoard(false)}
        />
      )}
      {allowance && (
        <Dialog title="Coding-agent allowance" onClose={() => setAllowance(false)}>
          <AgentAllowance />
        </Dialog>
      )}
      {setup && <LocalSetup onClose={() => setSetup(false)} />}
    </div>
  );
}

function NewProject({ onClose }: { onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <Dialog
      title="New project"
      busy={busy}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form
        className="project-file-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          const data = new FormData(event.currentTarget);
          setBusy(true);
          setError('');
          try {
            const repository = String(data.get('repository') || '').trim();
            const project = await api<{ id: string }>('/projects', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: data.get('name'),
                description: data.get('description'),
                ...(repository ? { repository } : {}),
              }),
            });
            visitProject(project.id);
          } catch (reason) {
            setError((reason as Error).message);
            setBusy(false);
          }
        }}
      >
        <p>A separate space for this product’s context, boards and explorations.</p>
        <label>
          Project name
          <input
            name="name"
            required
            maxLength={100}
            autoFocus
            placeholder="e.g. Customer onboarding"
          />
        </label>
        <label>
          Description
          <textarea name="description" maxLength={500} rows={3} />
        </label>
        <label>
          GitHub repository <span>(optional)</span>
          <input
            name="repository"
            placeholder="owner/repository"
            pattern="[a-zA-Z0-9-]+/[a-zA-Z0-9_.-]+"
          />
        </label>
        <p className="panel-hint">
          Public repositories only. Link one to see this project’s pull requests.
        </p>
        {error && <p role="alert">{error}</p>}
        <Button type="submit" disabled={busy}>
          {busy ? 'Creating…' : 'Create project'}
        </Button>
      </form>
    </Dialog>
  );
}

function NewBoard({ projects, onClose }: { projects: ProjectSummary[]; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <Dialog
      title="New planning board"
      busy={busy}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      {projects.length ? (
        <form
          className="project-file-form"
          onSubmit={async (event) => {
            event.preventDefault();
            if (busy) return;
            const data = new FormData(event.currentTarget);
            setBusy(true);
            setError('');
            try {
              const board = await api<{ id: string }>(
                '/boards',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ title: data.get('title') }),
                },
                String(data.get('project')),
              );
              location.assign(projectUrl(String(data.get('project')), 'board=' + board.id));
            } catch (reason) {
              setError((reason as Error).message);
              setBusy(false);
            }
          }}
        >
          <label>
            Project
            <select aria-label="Board project" name="project">
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Board name
            <input name="title" required maxLength={100} autoFocus placeholder="Product plan" />
          </label>
          <p>Text cards, connections and a canvas for your product thinking.</p>
          {error && <p role="alert">{error}</p>}
          <Button type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create board'}
          </Button>
        </form>
      ) : (
        <p>Create a project first, then add a planning board inside it.</p>
      )}
    </Dialog>
  );
}
