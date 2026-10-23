import { useEffect, useRef, useState } from 'react';
import {
  ArrowDownUp,
  ArrowUpRight,
  BookOpen,
  Component,
  Folder,
  Home,
  ChevronDown,
  GitBranch,
  Grid2X2,
  Layers,
  List,
  Monitor,
  Plus,
  Search,
  Smartphone,
  UserRound,
  X,
} from 'lucide-react';
import { api, publicDemo, requestLocalSetup, type Catalog } from './workbench-api';
import { Button } from './components/ui/button';
import { Dialog } from './components/ui/dialog';
import { PrototypeView } from './PrototypeView';
import { LiveThumbnail } from './LiveThumbnail';
import { DesignSystem } from './DesignSystem';
import {
  AgentPrompt,
  CreateProject,
  UserDesignSystem,
  type Project,
  type WorkspaceLocation,
} from './WorkspaceWelcome';
import { ProjectGuide } from './ProjectGuide';
import { LocalSetup } from './LocalSetup';

const example = new URLSearchParams(location.search).get('example') === 'nova';
type Page = 'all' | 'mine' | 'system' | 'start';
type Route = { page: Page; demo: string };
function readRoute(): Route {
  const hash = new URLSearchParams(location.hash.slice(1));
  const page = hash.get('page');
  return {
    page: page === 'mine' || page === 'system' || page === 'start' ? page : 'all',
    demo: hash.get('demo') ?? '',
  };
}
const initialCatalog: Catalog = {
  demos: [],
  warnings: [],
  revision: 0,
  designer: { name: 'Local designer', slug: 'local-designer' },
};
export function App() {
  const [route, setRoute] = useState<Route>(() => {
    const initial = readRoute();
    if (publicDemo && !example && !location.hash) {
      history.replaceState(null, '', '#demo=spend-in-dashboard');
      return { page: 'all', demo: 'spend-in-dashboard' };
    }
    return initial;
  });
  const [localSetup, setLocalSetup] = useState(false);
  useEffect(() => {
    const open = () => setLocalSetup(true);
    window.addEventListener('groot:local-setup', open);
    return () => window.removeEventListener('groot:local-setup', open);
  }, []);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [openIds, setOpenIds] = useState<string[]>(() =>
    readRoute().demo ? [readRoute().demo] : [],
  );
  const [catalog, setCatalog] = useState(initialCatalog);
  const [workspace, setWorkspace] = useState<{
    project: Project | null;
    legacyCount: number;
    workspace: WorkspaceLocation;
  } | null>(null);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState('');
  const [newExploration, setNewExploration] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const [list, setList] = useState(false);
  const [limit, setLimit] = useState(12);
  const searchRef = useRef<HTMLInputElement>(null);
  const projectName = example ? 'NOVA DENTAL' : (workspace?.project?.name ?? 'Your workspace');
  const current = useRef({ dirty, route });
  current.current = { dirty, route };
  useEffect(() => {
    let cancelled = false;
    let running = false;
    async function refresh() {
      if (running) return;
      running = true;
      try {
        const [next, info] = await Promise.all([
          api<Catalog>('/demos'),
          example
            ? Promise.resolve({
                project: null,
                legacyCount: 0,
                workspace: { mode: 'legacy' as const, path: '' },
              })
            : api<NonNullable<typeof workspace>>('/workspace'),
        ]);
        if (cancelled) return;
        const linked = readRoute().demo;
        if (!publicDemo && !example && linked && !next.demos.some((demo) => demo.id === linked)) {
          const response = await fetch('/api/demos?scope=example');
          const original = (await response.json()) as Catalog;
          if (!cancelled && original.demos.some((demo) => demo.id === linked)) {
            location.replace('?example=nova#demo=' + encodeURIComponent(linked));
            return;
          }
        }
        if (!cancelled) {
          setCatalog(next);
          setWorkspace(info);
          setError('');
          setLoaded(true);
        }
      } catch (reason) {
        if (!cancelled)
          setError(reason instanceof Error ? reason.message : 'Cannot read the local project.');
      } finally {
        running = false;
      }
    }
    void refresh();
    const timer = publicDemo ? undefined : setInterval(() => void refresh(), 1200);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);
  function go(next: Route) {
    if (dirty) {
      setNotice('Save or discard the controls preview before leaving this exploration.');
      return false;
    }
    setNotice('');
    setRoute(next);
    location.hash = next.demo
      ? 'demo=' + encodeURIComponent(next.demo)
      : next.page === 'all'
        ? ''
        : 'page=' + next.page;
    return true;
  }
  useEffect(() => {
    function change() {
      if (current.current.dirty) {
        const old = current.current.route;
        history.replaceState(
          null,
          '',
          old.demo ? '#demo=' + encodeURIComponent(old.demo) : '#page=' + old.page,
        );
        setNotice('Save or discard the controls preview before leaving this exploration.');
      } else setRoute(readRoute());
    }
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  useEffect(() => {
    if (!dirty) setNotice('');
  }, [dirty]);
  useEffect(() => {
    setLimit(12);
  }, [search, filter, route.page]);
  useEffect(() => {
    const title = route.demo
      ? (catalog.demos.find((demo) => demo.id === route.demo)?.title ?? 'Exploration')
      : {
          all: 'Explorations',
          mine: 'My Explorations',
          system: 'Design System',
          start: 'Start Here',
        }[route.page];
    document.title = title + ' — Groot';
  }, [route, catalog.demos]);
  useEffect(() => {
    if (route.demo)
      setRecentIds((ids) => [route.demo, ...ids.filter((id) => id !== route.demo)].slice(0, 12));
    if (route.demo) setOpenIds((ids) => (ids.includes(route.demo) ? ids : [...ids, route.demo]));
  }, [route.demo]);
  const system = catalog.demos.find(
    (demo) => demo.tags.includes('design-system') && !demo.parentId,
  );
  const active = route.demo || (route.page === 'system' && !example ? system?.id : undefined);
  const visible = catalog.demos
    .filter(
      (demo) =>
        (route.page !== 'mine' || demo.authorSlug === catalog.designer.slug) &&
        (filter === 'all' || demo.platform === filter) &&
        `${demo.title} ${demo.description} ${demo.tags.join(' ')}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === 'name' ? a.title.localeCompare(b.title, 'en') : b.modified.localeCompare(a.modified),
    );
  const navigate = (page: Page) => go({ page, demo: '' });
  return (
    <div
      className={
        'studio ' + (active ? 'has-exploration' : 'is-home') + (publicDemo ? ' public-demo' : '')
      }
    >
      <a className="skip-link" href="#workbench-main">
        Skip to content
      </a>
      {publicDemo && (
        <div className="demo-notice">
          <span>
            Demo project{' '}
            <span className="demo-note-detail">· Explore the app. Your own work stays local.</span>
          </span>
          <Button size="sm" onClick={() => setLocalSetup(true)}>
            Use my own project
          </Button>
        </div>
      )}
      <div className="file-tabs" aria-label="Open files">
        <button
          className="home-tab"
          aria-label="Home"
          title="Home"
          aria-current={!active ? 'page' : undefined}
          onClick={() => navigate('all')}
        >
          <Home size={18} />
        </button>
        {openIds
          .filter((id) => catalog.demos.some((demo) => demo.id === id))
          .map((id) => (
            <div className={'file-tab ' + (active === id ? 'is-active' : '')} key={id}>
              <button
                aria-current={active === id ? 'page' : undefined}
                onClick={() => go({ page: 'all', demo: id })}
              >
                {catalog.demos.find((demo) => demo.id === id)?.title}
              </button>
              <button
                aria-label={'Close ' + catalog.demos.find((demo) => demo.id === id)?.title}
                onClick={() => {
                  if (dirty) {
                    setNotice('Save or discard the controls preview before closing.');
                    return;
                  }
                  setOpenIds((ids) => ids.filter((item) => item !== id));
                  if (active === id) navigate('all');
                }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        <button
          aria-label="Start a new exploration"
          onClick={() => (publicDemo ? requestLocalSetup() : setNewExploration(true))}
        >
          <Plus size={18} />
        </button>
        <details className="recent-tabs">
          <summary aria-label="Recent tabs" title="Recent tabs">
            <ChevronDown size={17} />
          </summary>
          <div className="recent-tab-menu">
            <strong>Recent explorations</strong>
            {(recentIds.length
              ? recentIds
                  .map((id) => catalog.demos.find((demo) => demo.id === id))
                  .filter((demo) => !!demo)
              : catalog.demos.slice(0, 8)
            ).map((demo) => (
              <button
                key={demo.id}
                onClick={(event) => {
                  if (go({ page: 'all', demo: demo.id }))
                    event.currentTarget.closest('details')?.removeAttribute('open');
                }}
              >
                {demo.title}
              </button>
            ))}
            {!catalog.demos.length && <p>No recent explorations.</p>}
          </div>
        </details>
      </div>
      <header className="studio-bar">
        <div className="studio-identity">
          {projectName.toLowerCase() !== 'groot' && (
            <span className="project-name">{projectName}</span>
          )}
          {example && <span className="quiet-badge">Example project</span>}
        </div>
        <nav aria-label="Workspace navigation">
          {(
            [
              { page: 'all', label: 'Explorations', Icon: Grid2X2 },
              { page: 'mine', label: 'My Explorations', Icon: UserRound },
              { page: 'system', label: 'Design System', Icon: Component },
              { page: 'start', label: 'Start Here', Icon: BookOpen },
            ] as const
          ).map(({ page, label, Icon }) => (
            <button
              key={page}
              aria-current={route.page === page ? 'page' : undefined}
              onClick={() => navigate(page)}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="studio-global-actions">
          <span className={'connection ' + (error ? 'offline' : '')}>
            <i />
            {error ? 'Reconnecting' : 'Local'}
          </span>
          <Button
            className="sidebar-new"
            size="sm"
            variant="outline"
            onClick={() => (publicDemo ? requestLocalSetup() : setNewExploration(true))}
          >
            <Plus />
            New exploration
          </Button>
        </div>
      </header>
      <main id="workbench-main" tabIndex={-1}>
        {error && (
          <div role="alert" className="catalog-error">
            {error} Retrying automatically. Your current work stays visible.
          </div>
        )}
        {notice && dirty && (
          <div role="alert" className="preview-error">
            {notice}
          </div>
        )}
        {!loaded && !error ? (
          <div className="workspace-loading" role="status">
            Reading your local project…
          </div>
        ) : active ? (
          <PrototypeView
            key={active}
            id={active}
            catalog={catalog}
            onOpen={(demo) => go({ page: 'all', demo })}
            onDraftChange={setDirty}
            workspace={workspace?.workspace}
            productName={projectName}
          />
        ) : route.page === 'start' ? (
          <ProjectGuide
            project={workspace?.project ?? null}
            workspace={workspace?.workspace ?? { mode: 'legacy', path: '' }}
            revision={catalog.revision}
            example={example}
          />
        ) : route.page === 'system' ? (
          example ? (
            <div className="example-system">
              <DesignSystem />
            </div>
          ) : (
            <UserDesignSystem workspace={workspace?.workspace} onContinue={() => navigate('all')} />
          )
        ) : !example && !workspace?.project ? (
          <CreateProject
            onCreated={(project) =>
              setWorkspace({
                project,
                legacyCount: 0,
                workspace: workspace?.workspace ?? { mode: 'legacy', path: 'workspace' },
              })
            }
          />
        ) : (
          <div className="library-layout">
            <section className="exploration-library" aria-labelledby="library-title">
              <header className="library-title">
                <div>
                  <span className="section-label">{projectName} / Workspace</span>
                  <h1 id="library-title">
                    {route.page === 'mine' ? 'My explorations' : 'Explorations'}
                    <span>{visible.length}</span>
                  </h1>
                  <p>
                    {route.page === 'mine'
                      ? 'Work attributed to ' + catalog.designer.name + '.'
                      : 'Choose a direction. Open it. See what works.'}
                  </p>
                </div>
                <div className="library-display">
                  <Button
                    className="library-create"
                    onClick={() => (publicDemo ? requestLocalSetup() : setNewExploration(true))}
                  >
                    <Plus />
                    New exploration
                  </Button>
                  <label>
                    <ArrowDownUp size={13} />
                    <select
                      aria-label="Sort explorations"
                      value={sort}
                      onChange={(event) => setSort(event.target.value)}
                    >
                      <option value="recent">Recently changed</option>
                      <option value="name">Name</option>
                    </select>
                  </label>
                  <div className="layout-toggle">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Grid view"
                      aria-pressed={!list}
                      onClick={() => setList(false)}
                    >
                      <Grid2X2 />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="List view"
                      aria-pressed={list}
                      onClick={() => setList(true)}
                    >
                      <List />
                    </Button>
                  </div>
                </div>
              </header>
              <div className="library-toolbar">
                <div className="library-search">
                  <Search size={14} />
                  <input
                    ref={searchRef}
                    aria-label="Search explorations"
                    placeholder="Find an exploration…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  {search && (
                    <button
                      aria-label="Clear search"
                      onClick={() => {
                        setSearch('');
                        searchRef.current?.focus();
                      }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
                <div className="library-filters" aria-label="Platform filters">
                  {(
                    [
                      { id: 'all', label: 'All', Icon: Grid2X2 },
                      { id: 'web', label: 'Web', Icon: Monitor },
                      { id: 'mobile', label: 'Mobile', Icon: Smartphone },
                    ] as const
                  ).map(({ id, label, Icon }) => (
                    <button key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>
                      <Icon size={14} />
                      {label}
                      <span>
                        {
                          catalog.demos.filter((demo) => id === 'all' || demo.platform === id)
                            .length
                        }
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {catalog.warnings.map((warning) => (
                <p key={warning} className="catalog-error" role="alert">
                  {warning}
                </p>
              ))}
              <div className={'demo-grid ' + (list ? 'demo-list' : '')}>
                {visible.slice(0, limit).map((demo) => (
                  <article className="exploration-card" key={demo.id}>
                    <div className="card-preview">
                      <LiveThumbnail demo={demo} revision={catalog.revision} />
                      <span className="preview-type">
                        {demo.tags.includes('design-system') ? (
                          <Component size={12} />
                        ) : (
                          <Monitor size={12} />
                        )}
                        {demo.tags.includes('design-system')
                          ? 'Component showcase'
                          : demo.platform === 'mobile'
                            ? 'Mobile prototype'
                            : 'Web prototype'}
                      </span>
                    </div>
                    <div className="card-info">
                      <div className="card-title">
                        <h2>{demo.title}</h2>
                        <ArrowUpRight size={16} />
                      </div>
                      <p>{demo.description}</p>
                      <div className="card-lineage">
                        {demo.parentId ? (
                          <span>
                            <GitBranch size={12} />
                            Alternative of{' '}
                            {catalog.demos.find((parent) => parent.id === demo.parentId)?.title ??
                              demo.parentId}
                          </span>
                        ) : (
                          <span>Original direction</span>
                        )}
                        <span>{demo.author}</span>
                      </div>
                      <button
                        className="card-open"
                        aria-label={'Open ' + demo.title}
                        onClick={() => go({ page: 'all', demo: demo.id })}
                      />
                    </div>
                  </article>
                ))}
              </div>
              <div className="library-project-note">
                <span>Local workspace · {catalog.designer.name}</span>
                <a href={example ? './' : '?example=nova'}>
                  {example ? 'Back to your workspace' : 'NOVA · Example Project'}{' '}
                  <ArrowUpRight size={12} />
                </a>
              </div>
              {visible.length > limit && (
                <Button
                  className="load-more"
                  variant="outline"
                  onClick={() => setLimit((value) => value + 12)}
                >
                  Load more explorations
                </Button>
              )}
              {!visible.length && (
                <div className="library-empty">
                  <Layers size={26} />
                  <h2>
                    {!catalog.demos.length
                      ? 'Your first exploration starts here.'
                      : 'No matching explorations.'}
                  </h2>
                  <p>
                    {!catalog.demos.length
                      ? 'Give your coding agent a direction. Its saved exploration will appear here automatically.'
                      : 'Try another search or platform filter.'}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!catalog.demos.length) setNewExploration(true);
                      else {
                        setSearch('');
                        setFilter('all');
                        if (route.page === 'mine') navigate('all');
                      }
                    }}
                  >
                    {!catalog.demos.length ? 'Create an exploration' : 'Reset filters'}
                  </Button>
                </div>
              )}
              <footer className="library-footer">
                <span>
                  <i />
                  Watching project files
                </span>
                <span>
                  {visible.length} {visible.length === 1 ? 'exploration' : 'explorations'} · Changes
                  appear automatically
                </span>
              </footer>
            </section>
          </div>
        )}
      </main>
      {localSetup && <LocalSetup onClose={() => setLocalSetup(false)} />}
      {newExploration && (
        <Dialog title="Start a new exploration" onClose={() => setNewExploration(false)}>
          <p className="dialog-intro">
            Describe the direction to your existing coding agent. Groot will discover the files it
            saves.
          </p>
          <AgentPrompt
            kind="exploration"
            workspace={workspace?.workspace}
            onCancel={() => setNewExploration(false)}
          />
          <div className="handoff-note">
            <Folder size={15} />
            <span>Same project folder. No account or AI setup.</span>
          </div>
        </Dialog>
      )}
    </div>
  );
}
