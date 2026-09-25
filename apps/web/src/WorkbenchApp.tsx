import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  FolderHeart,
  Grid2X2,
  Layers,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from './components/ui/button';
import { useAppStore } from './store';
import { api, type Catalog, type Demo } from './workbench-api';
import { DesignSystem } from './DesignSystem';
import { PrototypeView } from './PrototypeView';
import {
  Orientation,
  AgentPrompt,
  CreateProject,
  UserDesignSystem,
  type Project,
} from './WorkspaceWelcome';
const example = new URLSearchParams(location.search).get('example') === 'nova';
type Page = 'all' | 'start' | 'system' | 'mine';
const empty: Catalog = {
  demos: [],
  warnings: [],
  revision: 0,
  designer: { name: 'Local designer', slug: 'local-designer' },
};
function Thumbnail({ demo }: { demo: Demo }) {
  const search = demo.id.includes('patient');
  if (!example)
    return (
      <div className="demo-thumbnail user-thumbnail" aria-hidden="true">
        <Layers size={32} />
        <strong>{demo.title}</strong>
        <span>{demo.platform === 'mobile' ? 'Mobile' : 'Web'} exploration</span>
      </div>
    );
  const simplified = Boolean(demo.parentId);
  return (
    <div className={'demo-thumbnail ' + (search ? 'thumb-mobile' : '')} aria-hidden="true">
      <div className="mini-clinic">
        <div className="mini-header">
          <b>
            ✳ NOVA <span>DENTAL</span>
          </b>
          <span>Northside clinic</span>
          <i>AP</i>
        </div>
        <div className="mini-body">
          <div className="mini-nav">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="mini-content">
            <small>{search ? 'PATIENT DIRECTORY' : 'APPOINTMENTS / BOOKING'}</small>
            <strong>
              {search
                ? 'Find your patient'
                : simplified
                  ? 'A simpler way to book.'
                  : 'Emergency appointment'}
            </strong>
            <div className="mini-step">
              {(search ? [1] : simplified ? [1, 2, 3] : [1, 2, 3, 4, 5, 6, 7]).map((n) => (
                <i key={n}>{n}</i>
              ))}
            </div>
            <div className="mini-panel">
              <span className="mini-input">⌕ Search patients</span>
              {['Avery Morgan', 'Jamie Ellis', 'Sam Rivera'].map((n, i) => (
                <div className="mini-person" key={n}>
                  <i>
                    {n[0]}
                    {n.split(' ')[1]?.[0]}
                  </i>
                  <span>
                    {n}
                    <small>NV-{1042 + i * 45} · Patient record</small>
                  </span>
                  <b>›</b>
                </div>
              ))}
              <span className="mini-cta">
                {search ? 'Recent patients' : simplified ? 'Find available slots →' : 'Continue →'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function StartHere({ revision }: { revision: number }) {
  const [context, setContext] = useState<{ name: string; content: string }[]>([]);
  const [selected, setSelected] = useState('START');
  const [error, setError] = useState('');
  useEffect(() => {
    api<typeof context>('/context')
      .then(setContext)
      .catch((e) => setError(e.message));
  }, [revision]);
  return (
    <div className="start-page">
      <div className="page-intro">
        <span className="eyebrow">A SHARED REPOSITORY. YOUR OWN AGENT.</span>
        <h1>Start here.</h1>
        <p>A short reference for making this workspace your own.</p>
      </div>
      <div className="context-layout">
        <nav aria-label="Product context">
          <button
            className={selected === 'START' ? 'active' : ''}
            onClick={() => setSelected('START')}
          >
            Using Playground
          </button>
          <span>{example ? 'NOVA PRODUCT CONTEXT' : 'YOUR PRODUCT CONTEXT'}</span>
          {context.map((c) => (
            <button
              key={c.name}
              className={selected === c.name ? 'active' : ''}
              onClick={() => setSelected(c.name)}
            >
              {c.name.charAt(0) + c.name.slice(1).toLowerCase()}
            </button>
          ))}
        </nav>
        <article>
          {error && <p role="alert">{error}</p>}
          {selected === 'START' && !example ? (
            <>
              <Orientation />
              <h2>Give your agent the product context</h2>
              <AgentPrompt kind="context" />
              <h2>Create a functional exploration</h2>
              <AgentPrompt kind="exploration" />
            </>
          ) : selected === 'START' ? (
            <>
              <h2>Your agent builds. Playground gives it a place.</h2>
              <p>
                Open this same repository in Codex, Claude Code, Cursor, Warp or your editor. Keep{' '}
                <code>pnpm dev</code> running. No AI account connects to Playground.
              </p>
              <h3>One folder per exploration</h3>
              <p>
                <code>demos/&lt;id&gt;/meta.json</code> describes the card. <code>src/App.tsx</code>{' '}
                is the interactive React prototype. <code>prototype.config.ts</code> optionally
                declares screens and states. New folders appear in the gallery automatically.
              </p>
              <h3>Give your agent the right context</h3>
              <p>
                Ask it to read <code>AGENTS.md</code>, relevant files in <code>context/</code>, and
                the matching <code>skills/*/SKILL.md</code>. Claude-specific additions live in{' '}
                <code>CLAUDE.md</code>. Skill autodiscovery varies by tool, so explicit paths always
                work.
              </p>
              <h3>Reuse before you create</h3>
              <p>
                Inspect <code>packages/design-system/src</code> before adding UI. The Design System
                page renders those same components. Shared fictional records live in{' '}
                <code>data/</code>.
              </p>
              <h3>Explore another direction</h3>
              <p>
                Open a demo and choose Create alternative. Playground copies its source into a new
                folder with a parent relationship and your local author. The original remains
                unchanged. You can also copy a folder in your editor and change its metadata ID to
                match the folder name.
              </p>
              <h3>Save a file. See it here.</h3>
              <p>
                Changes to demos, context, data and components are watched. A successful compile
                refreshes the preview automatically. A build error shows diagnostics and preserves
                the last compiled preview. Refresh resets prototype form state.
              </p>
              <h3>Keep context intentional</h3>
              <p>
                Established facts live in <code>context/</code>. Temporary assumptions and learnings
                live in a demo README. Feedback is readable local JSON; it never invokes an agent
                automatically.
              </p>
              <h3>Your local identity</h3>
              <p>
                Edit <code>.console/config.json</code> to set a name and slug. My Demos uses{' '}
                <code>authorSlug</code>, without accounts. This example workspace is fictional.
              </p>
            </>
          ) : (
            <pre className="context-document">
              {context.find((c) => c.name === selected)?.content}
            </pre>
          )}
        </article>
      </div>
    </div>
  );
}
export function App() {
  const [workspace, setWorkspace] = useState<{
    project: Project | null;
    legacyCount: number;
  } | null>(null);
  const [orientation, setOrientation] = useState(() => {
    try {
      return localStorage.getItem('playground.orientation.dismissed') !== 'yes';
    } catch {
      return true;
    }
  });
  const [creatingExploration, setCreatingExploration] = useState(false);
  const projectName = example ? 'NOVA DENTAL' : (workspace?.project?.name ?? 'Your workspace');
  const [draftDirty, setDraftDirty] = useState(false);
  const [navigationNotice, setNavigationNotice] = useState('');
  const [page, setPage] = useState<Page>('all');
  const [active, setActive] = useState(
    () => new URLSearchParams(location.hash.slice(1)).get('demo') ?? '',
  );
  const [catalog, setCatalog] = useState<Catalog>(empty);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [list, setList] = useState(false);
  const [appearance, setAppearance] = useState(false);
  const { settings, load, saveAccent, saving } = useAppStore();
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    document.documentElement.dataset.accent = settings.accent;
  }, [settings.accent]);
  useEffect(() => {
    let stopped = false;
    let running = false;
    async function refresh() {
      if (running) return;
      running = true;
      try {
        const [next, info] = await Promise.all([
          api<Catalog>('/demos'),
          example
            ? Promise.resolve({ project: null, legacyCount: 0 })
            : api<{ project: Project | null; legacyCount: number }>('/workspace'),
        ]);
        if (!stopped && !example) {
          const linked = new URLSearchParams(location.hash.slice(1)).get('demo');
          if (linked && !next.demos.some((d) => d.id === linked)) {
            const original = (await fetch('/api/demos?scope=example').then((r) =>
              r.json(),
            )) as Catalog;
            if (!stopped && original.demos.some((d) => d.id === linked)) {
              location.replace('?example=nova#demo=' + encodeURIComponent(linked));
              return;
            }
          }
        }
        if (!stopped) {
          setCatalog(next);
          setWorkspace(info);
          setError('');
          setLoaded(true);
        }
      } catch (e) {
        if (!stopped) setError(e instanceof Error ? e.message : 'Cannot read the local workspace.');
      } finally {
        running = false;
      }
    }
    void refresh();
    const timer = setInterval(() => void refresh(), 1200);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    const update = () => {
      const next = new URLSearchParams(location.hash.slice(1)).get('demo') ?? '';
      if (draftDirty && next !== active) {
        history.replaceState(null, '', '#demo=' + encodeURIComponent(active));
        setNavigationNotice(
          'Save or discard the controls preview before leaving this exploration.',
        );
        return;
      }
      setActive(next);
    };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, [draftDirty, active]);
  function open(id: string) {
    if (draftDirty) {
      setNavigationNotice('Save or discard the controls preview before leaving this exploration.');
      return false;
    }
    setNavigationNotice('');
    location.hash = id ? 'demo=' + encodeURIComponent(id) : '';
    setActive(id);
    return true;
  }
  useEffect(() => {
    if (!draftDirty) setNavigationNotice('');
  }, [draftDirty]);
  function navigate(next: Page) {
    if (open('')) setPage(next);
  }
  const demos = catalog.demos.filter(
    (d) =>
      (page !== 'mine' || d.authorSlug === catalog.designer.slug) &&
      (filter === 'all' || d.platform === filter) &&
      (d.title + ' ' + d.description + ' ' + d.tags.join(' '))
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <div className="workbench">
      <a className="skip-link" href="#workbench-main">
        Skip to content
      </a>
      <aside className="wb-sidebar">
        <a
          className="wb-brand"
          href={example ? '?example=nova' : './'}
          onClick={(e) => {
            e.preventDefault();
            navigate('all');
          }}
        >
          <span>
            <Layers size={18} />
          </span>
          playground<span className="brand-dot">.</span>
        </a>
        <div className="project-switch">
          <span className="nova-glyph">{projectName.charAt(0)}</span>
          <div>
            {projectName}
            <small>{example ? 'Example Project' : 'Your project'}</small>
          </div>
        </div>
        <span className="sidebar-label">WORKBENCH</span>
        <nav>
          {(
            [
              { id: 'all', label: 'All Demos', Icon: LayoutGrid },
              { id: 'start', label: 'Start Here', Icon: BookOpen },
              { id: 'system', label: 'Design System', Icon: Grid2X2 },
              { id: 'mine', label: 'My Demos', Icon: FolderHeart },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              className={page === id && !active ? 'selected' : ''}
              aria-current={page === id && !active ? 'page' : undefined}
              onClick={() => navigate(id)}
            >
              <Icon size={16} />
              {label}
              {id === 'all' && <span>{catalog.demos.length}</span>}
            </button>
          ))}
        </nav>
        <a
          className="example-link"
          href={example ? './' : '?example=nova'}
          onClick={(e) => {
            if (draftDirty) {
              e.preventDefault();
              setNavigationNotice(
                'Save or discard the controls preview before leaving this exploration.',
              );
            }
          }}
        >
          {example ? 'Back to your workspace' : 'NOVA · Example Project'}
        </a>
        <div className="sidebar-footer">
          <div className="watch-status">
            <i />
            {error ? 'Reconnecting…' : 'Connected to local files'}
          </div>
          <button
            className="local-profile"
            onClick={() => setAppearance(!appearance)}
            aria-expanded={appearance}
          >
            <span>{catalog.designer.name.charAt(0)}</span>
            <div>
              {catalog.designer.name}
              <small>Local workspace</small>
            </div>
            <SlidersHorizontal size={14} />
          </button>
          {appearance && (
            <div className="appearance-popover">
              <span>Workspace accent</span>
              {(['neutral', 'sage', 'blue'] as const).map((a) => (
                <button
                  key={a}
                  disabled={saving}
                  aria-pressed={settings.accent === a}
                  onClick={() => void saveAccent(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
      <div className="wb-main">
        <header className="wb-topbar">
          <div>
            {projectName}
            <ChevronRight size={13} />
            <span>
              {active
                ? 'Exploration'
                : page === 'all'
                  ? 'All Demos'
                  : page === 'mine'
                    ? 'My Demos'
                    : page === 'start'
                      ? 'Start Here'
                      : 'Design System'}
            </span>
          </div>
          <span className="local-badge">{example ? 'EXAMPLE PROJECT' : 'LOCAL WORKSPACE'}</span>
        </header>
        <main id="workbench-main" tabIndex={-1}>
          {error && (
            <div role="alert" className="catalog-error">
              {error} Retrying automatically.
            </div>
          )}
          {navigationNotice && draftDirty && (
            <p className="preview-error" role="alert">
              {navigationNotice}
            </p>
          )}
          {!example && orientation && (
            <Orientation
              onDismiss={() => {
                setOrientation(false);
                try {
                  localStorage.setItem('playground.orientation.dismissed', 'yes');
                } catch {
                  /* session dismissal still works */
                }
              }}
            />
          )}
          {!example && workspace && workspace.legacyCount > 0 && (
            <p className="legacy-notice">
              Existing explorations in the original repository remain available.{' '}
              <a href="?example=nova">Open original explorations</a>
            </p>
          )}
          {!example && !loaded ? (
            <p role="status">Reading your workspace…</p>
          ) : !example && !workspace?.project && !active && page === 'all' ? (
            <CreateProject
              onCreated={(project) =>
                setWorkspace({ project, legacyCount: workspace?.legacyCount ?? 0 })
              }
            />
          ) : active ? (
            <PrototypeView
              key={active}
              id={active}
              catalog={catalog}
              onDraftChange={setDraftDirty}
              onOpen={open}
              onBack={() => open('')}
            />
          ) : page === 'system' ? (
            <>
              {example ? <DesignSystem /> : <UserDesignSystem onContinue={() => navigate('all')} />}
            </>
          ) : page === 'start' ? (
            <StartHere revision={catalog.revision} />
          ) : (
            <div className="gallery-page">
              <div className="gallery-heading">
                <div>
                  <span className="eyebrow">{projectName} / EXPLORATIONS</span>
                  <h1>{page === 'mine' ? 'My explorations' : 'All explorations'}</h1>
                  <p>
                    {page === 'mine'
                      ? 'Independent alternatives created by ' + catalog.designer.name + '.'
                      : 'Working prototypes. Different directions. One shared product context.'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    example ? navigate('start') : setCreatingExploration(!creatingExploration)
                  }
                >
                  {example ? 'How to add a demo' : 'Create an exploration'}
                  <ArrowUpRight />
                </Button>
              </div>
              {!example && creatingExploration && <AgentPrompt kind="exploration" />}
              <div className="gallery-tools">
                <div className="gallery-filters" aria-label="Platform filters">
                  {['all', 'mobile', 'web'].map((f) => (
                    <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>
                      {f.toUpperCase()}
                      {f === 'all' && <span>{catalog.demos.length}</span>}
                    </button>
                  ))}
                </div>
                <label className="gallery-search">
                  <Search size={15} />
                  <input
                    aria-label="Search demos"
                    placeholder="Search explorations…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <div className="layout-toggle">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Grid view"
                    aria-pressed={!list}
                    onClick={() => setList(false)}
                  >
                    <LayoutGrid />
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
              <div className="gallery-section-label">
                <span>{page === 'mine' ? 'YOUR EXPLORATIONS' : 'ALL EXPLORATIONS'}</span>
                <span>
                  {demos.length} {demos.length === 1 ? 'demo' : 'demos'}
                </span>
              </div>
              {!loaded && !error && <p role="status">Reading local demos…</p>}
              {catalog.warnings.map((w) => (
                <p key={w} role="alert" className="catalog-error">
                  {w}
                </p>
              ))}
              <div className={'demo-grid ' + (list ? 'demo-list' : '')}>
                {demos.map((d) => (
                  <button
                    className="demo-card"
                    key={d.id}
                    onClick={() => open(d.id)}
                    aria-label={'Open ' + d.title}
                  >
                    <Thumbnail demo={d} />
                    <div className="demo-card-body">
                      <div className="demo-kicker">
                        <span>{d.platform.toUpperCase()}</span>
                        {d.parentId && <span>ALTERNATIVE</span>}
                        <ArrowUpRight size={14} />
                      </div>
                      <h2>{d.title}</h2>
                      <p>{d.description}</p>
                      <div className="demo-card-meta">
                        <span className="author-initial">{d.author.charAt(0)}</span>
                        <span>{d.author}</span>
                        <time dateTime={d.modified}>
                          {new Date(d.modified).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </time>
                      </div>
                      <div className="demo-tags">
                        {d.tags.map((t) => (
                          <span key={t}>{t}</span>
                        ))}
                      </div>
                      {d.parentId && (
                        <div className="parent-note">
                          ↳ Alternative of{' '}
                          {catalog.demos.find((p) => p.id === d.parentId)?.title ?? d.parentId}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              {loaded && !demos.length && (
                <div className="gallery-empty">
                  <FolderHeart size={28} />
                  <h2>
                    {!example && !catalog.demos.length
                      ? 'Your first exploration starts here.'
                      : page === 'mine'
                        ? 'Make an exploration your own.'
                        : 'No matching explorations.'}
                  </h2>
                  <p>
                    {!example && !catalog.demos.length
                      ? 'Tell your coding agent what you want to explore. Save its prototype in workspace/demos and it will appear here automatically.'
                      : page === 'mine'
                        ? 'Open a demo and create an alternative. It will appear here.'
                        : 'Try another search or platform filter.'}
                  </p>
                  {!example && !catalog.demos.length ? (
                    <AgentPrompt kind="exploration" />
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearch('');
                        setFilter('all');
                        if (page === 'mine') navigate('all');
                      }}
                    >
                      View all demos
                    </Button>
                  )}
                </div>
              )}
              <footer className="gallery-footer">
                <span>
                  <i />
                  Live from <code>{example ? 'demos/' : 'workspace/demos/'}</code>
                </span>
                <span>
                  {example ? 'NOVA DENTAL · Example Project · Fictional data' : projectName}
                </span>
              </footer>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
