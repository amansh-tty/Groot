import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize,
  FileCode2,
  Monitor,
  PanelRightClose,
  PanelRightOpen,
  RefreshCw,
  Smartphone,
  MessageSquare,
  MousePointer2,
  GitBranch,
  Columns2,
  X,
  Info,
} from 'lucide-react';
import {
  elementContextSchema,
  prototypeConfigSchema,
  type ElementContext,
  type Feedback,
  type PrototypeConfig,
} from '@playground/shared';
import {
  api,
  apiUrl,
  publicDemo,
  requestLocalSetup,
  type Catalog,
  type Detail,
} from './workbench-api';
import { ControlsPanel } from './ControlsPanel';
import { CompareView } from './CompareView';
import { VariationSummary } from './VariationSummary';
import { PromptExcerpt } from './PromptExcerpt';
import { explorationFamily } from './ExplorationTree';
import { FeedbackPanel } from './FeedbackPanel';
import { Button } from './components/ui/button';
import { Dialog } from './components/ui/dialog';
export function PrototypeView({
  id,
  catalog,
  onOpen,
  onDraftChange,
  workspace,
  productName,
}: {
  id: string;
  catalog: Catalog;
  onOpen: (id: string) => void;
  onDraftChange: (dirty: boolean) => void;
  workspace?: { mode: 'external' | 'legacy'; path: string };
  productName: string;
}) {
  const example = new URLSearchParams(location.search).get('example') === 'nova';
  const demoFolder = example
    ? 'demos/'
    : workspace?.mode === 'external'
      ? 'demos/'
      : 'workspace/demos/';
  const [detail, setDetail] = useState<Detail | null>(null);
  const [config, setConfig] = useState<PrototypeConfig>({
    screens: [],
    states: [],
    viewport: 'desktop',
  });
  const [screen, setScreen] = useState('');
  const [state, setState] = useState('default');
  const [viewport, setViewport] = useState('desktop');
  const [fit, setFit] = useState(true);
  const [fitScale, setFitScale] = useState(1);
  const canvas = useRef<HTMLDivElement>(null);
  const [panel, setPanel] = useState(true);
  const [panelWidth, setPanelWidth] = useState(300);
  const resizeStart = useRef<{ x: number; width: number } | null>(null);
  const [frame, setFrame] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [inspectorTab, setInspectorTab] = useState<'review' | 'controls' | 'details'>('controls');
  const [controlsDirty, setControlsDirty] = useState(false);
  const controlDraft = useRef<Record<string, number> | null>(null);
  const [comparing, setComparing] = useState(false);
  const [compareTarget, setCompareTarget] = useState('');
  const [description, setDescription] = useState('');
  const [rationale, setRationale] = useState('');
  const [handoff, setHandoff] = useState<'screen' | 'state' | null>(null);
  const [handoffName, setHandoffName] = useState('');
  const [handoffCopied, setHandoffCopied] = useState('');
  const [forking, setForking] = useState(false);
  const [title, setTitle] = useState('');
  const [forkError, setForkError] = useState('');
  const alternativeName = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [commentMode, setCommentMode] = useState(false);
  const [target, setTarget] = useState<ElementContext | null>(null);
  const [feedbackItems, setFeedbackItems] = useState<Feedback[]>([]);
  const [activeFeedback, setActiveFeedback] = useState('');
  const [feedbackNotice, setFeedbackNotice] = useState('');
  const feedbackState = useRef({ enabled: commentMode, items: feedbackItems });
  feedbackState.current = { enabled: commentMode, items: feedbackItems };
  const iframe = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const node = canvas.current;
    if (!node || comparing) return;
    const resize = new ResizeObserver(([entry]) => {
      if (entry) {
        const width = viewport === 'mobile' ? 390 : 1440;
        const height = viewport === 'mobile' ? 844 : 1024;
        setFitScale(
          Math.max(
            0.1,
            Math.min(1, entry.contentRect.width / width, entry.contentRect.height / height),
          ),
        );
      }
    });
    resize.observe(node);
    return () => resize.disconnect();
  }, [viewport, fit, comparing]);
  const selection = useRef({ screen, state });
  selection.current = { screen, state };
  useEffect(() => {
    setFrame('');
    setInspectorTab('controls');
    setControlsDirty(false);
    controlDraft.current = null;
    setCommentMode(false);
    setTarget(null);
    setFeedbackItems([]);
    setActiveFeedback('');
    setPanel(true);
    setConfig({ screens: [], states: [], viewport: 'desktop' });
    setScreen('');
    setState('default');
    setDetail(null);
    setViewport(
      catalog.demos.find((d) => d.id === id)?.platform === 'mobile' ? 'mobile' : 'desktop',
    );
  }, [id]);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([
      api<Detail>('/demos/' + id),
      api<{ html?: string; error?: string; revision: number }>('/demos/' + id + '/preview'),
    ])
      .then(([next, result]) => {
        if (cancelled) return;
        setDetail(next);
        if (result.error) setError(result.error);
        else
          setFrame(
            apiUrl('/demos/' + id + '/frame?revision=' + result.revision + '&refresh=' + refresh),
          );
      })
      .catch((e) => {
        if (!cancelled) setError(String(e.message));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, catalog.revision, refresh]);
  useEffect(() => {
    function receive(event: MessageEvent) {
      if (
        event.source !== iframe.current?.contentWindow ||
        event.data?.channel !== 'playground-preview'
      )
        return;
      if (event.data.type === 'element-selected') {
        const parsed = elementContextSchema.safeParse(event.data.target);
        if (parsed.success) {
          setTarget(parsed.data);
          setPanel(true);
          setInspectorTab('review');
          setActiveFeedback('');
        }
      }
      if (event.data.type === 'feedback-exit') {
        setCommentMode(false);
        setTarget(null);
      }
      if (event.data.type === 'feedback-open') {
        setActiveFeedback(String(event.data.id));
        setPanel(true);
        setInspectorTab('review');
      }
      if (event.data.type === 'feedback-missing') setFeedbackNotice(String(event.data.message));
      if (event.data.type === 'ready') {
        if (controlDraft.current)
          iframe.current?.contentWindow?.postMessage(
            { channel: 'playground-host', type: 'controls', values: controlDraft.current },
            '*',
          );
        iframe.current?.contentWindow?.postMessage(
          { channel: 'playground-host', type: 'feedback', ...feedbackState.current },
          '*',
        );
        const parsed = prototypeConfigSchema.safeParse(event.data.config);
        if (parsed.success) {
          setConfig(parsed.data);
          if (event.data.config?.viewport) setViewport(parsed.data.viewport);
        }
        iframe.current?.contentWindow?.postMessage(
          { channel: 'playground-host', type: 'select', ...selection.current },
          '*',
        );
      }
      if (event.data.type === 'error' && typeof event.data.message === 'string')
        setError(event.data.message.slice(0, 2000));
    }
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, []);
  useEffect(() => {
    iframe.current?.contentWindow?.postMessage(
      { channel: 'playground-host', type: 'select', screen, state },
      '*',
    );
  }, [screen, state]);
  useEffect(() => {
    iframe.current?.contentWindow?.postMessage(
      { channel: 'playground-host', type: 'feedback', enabled: commentMode, items: feedbackItems },
      '*',
    );
  }, [commentMode, feedbackItems]);
  function focusFeedback(item: Feedback) {
    setCommentMode(true);
    setActiveFeedback(item.id);
    setTarget(null);
    setFeedbackNotice('');
    setScreen(item.screen);
    setState(item.state);
    // React renders the requested declared screen before locating its element.
    window.setTimeout(
      () =>
        iframe.current?.contentWindow?.postMessage(
          { channel: 'playground-host', type: 'feedback-focus', id: item.id },
          '*',
        ),
      180,
    );
  }
  function allowNavigation() {
    if (controlsDirty) {
      setFeedbackNotice('Save or discard the controls preview before leaving.');
      return false;
    }
    return true;
  }
  function previewControls(values: Record<string, number>) {
    controlDraft.current = values;
    iframe.current?.contentWindow?.postMessage(
      { channel: 'playground-host', type: 'controls', values },
      '*',
    );
  }
  useEffect(() => {
    onDraftChange(controlsDirty);
    return () => onDraftChange(false);
  }, [controlsDirty, onDraftChange]);
  const meta = catalog.demos.find((d) => d.id === id);
  const related = explorationFamily(catalog, id);
  async function fork(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setForkError('Enter an alternative name.');
      alternativeName.current?.focus();
      return;
    }
    setSaving(true);
    setForkError('');
    try {
      const result = await api<{ id: string }>('/demos/' + id + '/fork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, rationale }),
      });
      setForking(false);
      onOpen(result.id);
    } catch (e) {
      setForkError(e instanceof Error ? e.message : 'Could not create alternative.');
    } finally {
      setSaving(false);
    }
  }
  const fitted = fit || viewport === 'mobile';
  const width = viewport === 'mobile' ? 390 : 1440;
  const height = viewport === 'mobile' ? 844 : 1024;
  function showTool(tab: 'review' | 'controls' | 'details') {
    if (!allowNavigation()) return;
    setInspectorTab(tab);
    setPanel(true);
  }
  const startVariation = () => {
    if (publicDemo) {
      requestLocalSetup();
      return;
    }
    if (!allowNavigation()) return;
    setTitle((detail?.meta.title ?? 'Exploration') + ' — Alternative');
    setDescription('');
    setRationale('');
    setForkError('');
    setForking(true);
  };
  const changeScreen = (direction: number) => {
    const index = Math.max(
      0,
      config.screens.findIndex((item) => item.id === screen),
    );
    const next = config.screens[index + direction];
    if (next) {
      setScreen(next.id);
      setState('default');
    }
  };
  const handoffPrompt = `Read the project context and ${demoFolder}${id}/src/App.tsx and prototype.config.ts. Add a ${handoff ?? 'screen'} named "${handoffName.trim() || '[name]'}" within this variation. ${handoff === 'screen' ? 'This is another destination in the same flow; define its navigation explicitly.' : 'This is a condition of the current screen, not a separate variation.'} Preserve existing screens, states, feedback and interactions. Use the project design system. Ask for missing behavior; document assumptions. Record this prompt in ${demoFolder}${id}/prompts.json as an array entry with prompt and ISO createdAt. Do not install dependencies or add backend access.`;
  if (comparing)
    return (
      <CompareView
        id={id}
        initialRight={compareTarget}
        catalog={catalog}
        onClose={() => setComparing(false)}
      />
    );
  return (
    <div className="prototype-page">
      <aside className="variation-panel" aria-label="Variations">
        <div className="variation-project">
          <span className="section-label">Exploration</span>
          <h1>{detail?.meta.title ?? meta?.title}</h1>
        </div>
        <Button variant="outline" onClick={startVariation}>
          <Plus />
          Create variation
        </Button>
        <div className="variation-list">
          {related.map((item) => (
            <VariationSummary
              key={item.id}
              item={catalog.demos.find((demo) => demo.id === item.id)!}
              original={item.depth === 0}
              current={item.id === id}
              detail={detail}
              revision={catalog.revision}
              onOpen={() => {
                if (allowNavigation()) onOpen(item.id);
              }}
            />
          ))}
        </div>
        <section className="prompt-history">
          <h2>Prompt history</h2>
          {detail?.promptError ? (
            <p role="status">{detail.promptError}</p>
          ) : detail?.prompts?.length ? (
            detail.prompts.map((entry, index) => (
              <article key={entry.createdAt + index}>
                <time dateTime={entry.createdAt}>
                  {new Date(entry.createdAt).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </time>
                <PromptExcerpt title={`Prompt ${index + 1}`} text={entry.prompt} />
              </article>
            ))
          ) : (
            <p>No prompts recorded yet.</p>
          )}
          <details>
            <summary>How to record prompts</summary>
            <p>
              Ask your agent to append the prompt and its ISO date to this variation’s{' '}
              <code>prompts.json</code>. Groot shows saved records; it cannot read your agent’s
              conversation.
            </p>
          </details>
        </section>
      </aside>

      {error && (
        <div className="preview-error" role="alert">
          <strong>Preview needs attention</strong>
          <span>
            {frame
              ? 'Your last working preview is still available. Fix the source and save to retry.'
              : 'Correct the source and save to build a preview.'}
          </span>
          <details>
            <summary>View diagnostics</summary>
            <pre>{error}</pre>
          </details>
        </div>
      )}
      <div
        className={'preview-layout ' + (!panel ? 'inspector-hidden' : '')}
        style={{ '--inspector-width': `${panelWidth}px` } as CSSProperties}
      >
        <div className="canvas-dock" role="toolbar" aria-label="Preview tools">
          <div className="dock-group">
            <Button
              variant="ghost"
              size="sm"
              title="Interact"
              aria-pressed={!commentMode}
              onClick={() => {
                setCommentMode(false);
                setTarget(null);
              }}
            >
              <MousePointer2 />
              Interact
            </Button>
            <Button
              variant="ghost"
              size="sm"
              title="Comment"
              aria-label="Comment"
              aria-pressed={commentMode}
              onClick={() => {
                if (!allowNavigation()) return;
                if (publicDemo) {
                  requestLocalSetup();
                  return;
                }
                setCommentMode(!commentMode);
                setPanel(true);
                setInspectorTab('review');
                setTarget(null);
              }}
            >
              <MessageSquare />
              <span className="toolbar-comment-count">
                {feedbackItems.filter((item) => item.status === 'open').length}
              </span>
              <span className="sr-only">Comment</span>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Fit preview"
            title="Fit preview"
            onClick={() => {
              setFit(false);
              requestAnimationFrame(() => setFit(true));
            }}
          >
            <Maximize />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Zoom in"
            title="Zoom in"
            onClick={() => {
              setFit(true);
              setFitScale((value) => Math.min(2, value + 0.1));
            }}
          >
            <ZoomIn />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Zoom out"
            title="Zoom out"
            onClick={() => {
              setFit(true);
              setFitScale((value) => Math.max(0.1, value - 0.1));
            }}
          >
            <ZoomOut />
          </Button>
          <span className="dock-divider" />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Refresh preview"
            title="Reload preview"
            onClick={() => {
              if (allowNavigation()) {
                setError('');
                setRefresh((value) => value + 1);
              }
            }}
          >
            <RefreshCw />
          </Button>
        </div>
        <div
          ref={canvas}
          className={'preview-canvas ' + viewport + (commentMode ? ' commenting' : '')}
        >
          {!panel && (
            <Button
              className="reopen-tools"
              variant="outline"
              size="icon"
              aria-label="Show inspector"
              title="Show tools"
              onClick={() => setPanel(true)}
            >
              <PanelRightOpen />
            </Button>
          )}
          <div className="canvas-view-tools">
            {' '}
            <div className="dock-group">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Desktop viewport"
                title="Desktop viewport"
                aria-pressed={viewport === 'desktop'}
                onClick={() => setViewport('desktop')}
              >
                <Monitor />
                <span>Desktop</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Mobile viewport"
                title="Mobile viewport"
                aria-pressed={viewport === 'mobile'}
                onClick={() => setViewport('mobile')}
              >
                <Smartphone />
                <span>Mobile</span>
              </Button>
              {viewport === 'desktop' && (
                <Button
                  variant="ghost"
                  size="sm"
                  aria-pressed={fit}
                  onClick={() => setFit(!fit)}
                  title="Fit the preview to the available canvas"
                >
                  {fit ? 'Fit' : 'Actual size'}
                </Button>
              )}
            </div>
            <span className="canvas-scale">{Math.round(fitScale * 100)}%</span>
          </div>
          <div className="screen-heading">
            <h2>
              {config.screens.find((item) => item.id === screen)?.label ??
                (config.screens[0]?.label || 'Preview')}
            </h2>
            <div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Previous screen"
                disabled={config.screens.findIndex((item) => item.id === screen) <= 0}
                onClick={() => changeScreen(-1)}
              >
                <ArrowLeft />
              </Button>
              <span>
                {config.screens.length
                  ? Math.max(1, config.screens.findIndex((item) => item.id === screen) + 1)
                  : 0}{' '}
                of {config.screens.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Next screen"
                disabled={
                  config.screens.length < 2 ||
                  config.screens.findIndex((item) => item.id === screen) >=
                    config.screens.length - 1
                }
                onClick={() => changeScreen(1)}
              >
                <ArrowRight />
              </Button>
            </div>
          </div>
          <div className="stage-caption">
            <span>{detail?.meta.title ?? meta?.title ?? 'Exploration'}</span>
            <span>
              {viewport === 'mobile' ? '390 × 844' : fit ? '1440 × 1024' : 'Responsive desktop'}
              {fitted ? ' · ' + Math.round(fitScale * 100) + '%' : ''}
            </span>
          </div>
          <div
            className={'preview-frame-wrap ' + (fitted ? 'fit-preview' : 'unscaled-preview')}
            style={fitted ? { width: width * fitScale, height: height * fitScale } : undefined}
          >
            {frame ? (
              <iframe
                ref={iframe}
                title="Interactive prototype"
                key={id}
                src={frame}
                sandbox="allow-scripts"
                referrerPolicy="no-referrer"
                style={
                  fitted
                    ? {
                        width,
                        height,
                        transform: `scale(${fitScale})`,
                        transformOrigin: 'top left',
                      }
                    : undefined
                }
              />
            ) : (
              <div className="preview-placeholder" role="status">
                {loading
                  ? 'Preparing your exploration…'
                  : 'No working preview yet. Check the source file.'}
              </div>
            )}
          </div>
          <span className="canvas-mode-hint" role="status">
            {commentMode
              ? 'Comment mode · Select an element. Escape to interact.'
              : 'Interactive prototype · Local data'}
          </span>
        </div>
        <aside className="inspector" hidden={!panel} aria-label="Exploration tools">
          <div
            className="inspector-resize"
            role="separator"
            aria-label="Resize tools panel"
            aria-orientation="vertical"
            aria-valuemin={240}
            aria-valuemax={520}
            aria-valuenow={panelWidth}
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault();
                setPanelWidth((value) =>
                  Math.max(240, Math.min(520, value + (event.key === 'ArrowLeft' ? 16 : -16))),
                );
              }
            }}
            onPointerDown={(event) => {
              resizeStart.current = { x: event.clientX, width: panelWidth };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (resizeStart.current)
                setPanelWidth(
                  Math.max(
                    240,
                    Math.min(
                      520,
                      resizeStart.current.width + resizeStart.current.x - event.clientX,
                    ),
                  ),
                );
            }}
            onPointerUp={() => {
              resizeStart.current = null;
            }}
            onPointerCancel={() => {
              resizeStart.current = null;
            }}
          />
          <header className="inspector-header">
            <h2>
              {inspectorTab === 'review'
                ? 'Comments'
                : inspectorTab === 'controls'
                  ? 'Controls'
                  : 'Preview'}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close tools"
              onClick={() => {
                if (allowNavigation()) setPanel(false);
              }}
            >
              <X />
            </Button>
          </header>
          <div className="inspector-tabs" role="group" aria-label="Inspector sections">
            <button aria-pressed={inspectorTab === 'controls'} onClick={() => showTool('controls')}>
              Controls
            </button>
            <button aria-pressed={inspectorTab === 'details'} onClick={() => showTool('details')}>
              Preview
            </button>
            <button aria-pressed={inspectorTab === 'review'} onClick={() => showTool('review')}>
              Comments{' '}
              <span>{feedbackItems.filter((item) => item.status === 'open').length || ''}</span>
            </button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={panel ? 'Hide inspector' : 'Show inspector'}
              title={panel ? 'Hide tools' : 'Review and details'}
              onClick={() => {
                if (allowNavigation()) setPanel(!panel);
              }}
            >
              {panel ? <PanelRightClose /> : <PanelRightOpen />}
            </Button>
          </div>
          <div className="inspector-body">
            {feedbackNotice && (
              <p role="status" className="panel-notice">
                {feedbackNotice}
              </p>
            )}
            <div hidden={inspectorTab !== 'review'}>
              <FeedbackPanel
                key={id}
                id={id}
                revision={catalog.revision}
                target={target}
                activeId={activeFeedback}
                onCancel={() => setTarget(null)}
                onItems={setFeedbackItems}
                onFocus={focusFeedback}
              />
            </div>
            <div
              hidden={inspectorTab !== 'controls'}
              className="inspector-section screen-state-section"
            >
              <h2>Screen &amp; state</h2>
              <div className="screen-state-fields">
                {config.screens.length > 0 && (
                  <label>
                    Screen
                    <select
                      aria-label="Preview screen"
                      value={screen}
                      onChange={(event) => setScreen(event.target.value)}
                    >
                      <option value="">Start of flow</option>
                      {config.screens.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {config.states.length > 0 && (
                  <label>
                    State
                    <select
                      aria-label="Preview state"
                      value={state}
                      onChange={(event) => setState(event.target.value)}
                    >
                      {config.states.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              {!config.screens.length && (
                <p>No screens declared yet. Your agent can define this flow.</p>
              )}
              <div className="add-screen-actions">
                {(['screen', 'state'] as const).map((kind) => (
                  <Button
                    key={kind}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (publicDemo) {
                        requestLocalSetup();
                        return;
                      }
                      if (allowNavigation()) {
                        setHandoff(kind);
                        setHandoffName('');
                        setHandoffCopied('');
                      }
                    }}
                  >
                    <Plus /> {kind === 'screen' ? 'Screen' : 'State'}
                  </Button>
                ))}
              </div>
              <p className="context-help">Create a handoff for your coding agent.</p>
              {!config.controls && (
                <p className="context-help">No design controls are declared for this variation.</p>
              )}
            </div>
            {config.controls && (
              <div hidden={inspectorTab !== 'controls'}>
                <ControlsPanel
                  key={id}
                  id={id}
                  revision={catalog.revision}
                  onPreview={previewControls}
                  onDirty={setControlsDirty}
                  onScreen={(next) => {
                    setScreen(next);
                    setState('default');
                  }}
                />
              </div>
            )}
            <section
              hidden={inspectorTab !== 'controls'}
              className="inspector-section compare-launch"
            >
              <h2>Compare directions</h2>
              <div className="compare-current">
                <span className="section-label">Current flow</span>
                <strong>{detail?.meta.title ?? meta?.title}</strong>
                <span>This variation · A</span>
              </div>
              <label className="compare-choice">
                Compare with
                <select
                  aria-label="Compare with"
                  value={
                    catalog.demos.some((item) => item.id === compareTarget && item.id !== id)
                      ? compareTarget
                      : ''
                  }
                  onChange={(event) => setCompareTarget(event.target.value)}
                >
                  <option value="">Choose another flow…</option>
                  <optgroup label="Related variations">
                    {related
                      .filter((item) => item.id !== id)
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.title}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Other explorations">
                    {catalog.demos
                      .filter(
                        (item) =>
                          item.id !== id && !related.some((relative) => relative.id === item.id),
                      )
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.title}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </label>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  !compareTarget ||
                  compareTarget === id ||
                  !catalog.demos.some((item) => item.id === compareTarget)
                }
                onClick={() => {
                  if (allowNavigation()) {
                    setComparing(true);
                    setCommentMode(false);
                  }
                }}
              >
                <Columns2 />
                Compare
              </Button>
            </section>
            <div hidden={inspectorTab !== 'details'}>
              <section className="inspector-section">
                <h2>Run the flow</h2>
                <p>Use the prototype’s buttons or choose a declared screen below.</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCommentMode(false);
                    setTarget(null);
                  }}
                >
                  Interact with prototype
                </Button>
                <div className="preview-screen-list">
                  {config.screens.map((item) => (
                    <button
                      key={item.id}
                      aria-pressed={screen === item.id}
                      onClick={() => {
                        setScreen(item.id);
                        setState('default');
                      }}
                    >
                      {item.label}
                      <ArrowRight size={14} />
                    </button>
                  ))}
                </div>
              </section>

              <section className="inspector-section">
                <span className="section-label">{example ? 'Example project' : productName}</span>
                <h2>{detail?.meta.title ?? meta?.title}</h2>
                <p>{detail?.meta.description ?? meta?.description}</p>
              </section>
              {detail?.meta.rationale && (
                <section className="inspector-section">
                  <h2>Design rationale</h2>
                  <p>{detail.meta.rationale}</p>
                </section>
              )}
              <details className="inspector-section" open>
                <summary>
                  <Info size={13} />
                  Assumptions & notes
                </summary>
                <pre>
                  {detail?.readme ||
                    'No assumptions or learnings have been recorded for this exploration.'}
                </pre>
              </details>
              <details className="inspector-section">
                <summary>
                  <FileCode2 size={13} />
                  Source files
                </summary>
                <code>
                  {demoFolder}
                  {id}/src/App.tsx
                </code>
                <p>Edit this file with your coding agent. Saved changes appear automatically.</p>
              </details>
            </div>
          </div>
        </aside>
      </div>
      {handoff && (
        <Dialog
          title={handoff === 'screen' ? 'Add a screen' : 'Add a state'}
          onClose={() => setHandoff(null)}
        >
          <p className="dialog-intro">
            {handoff === 'screen'
              ? 'Add a destination within this variation’s flow.'
              : 'Add a condition of this screen, such as loading, empty, or error.'}{' '}
            Your coding agent will implement it.
          </p>
          <label className="handoff-name">
            {handoff === 'screen' ? 'Screen name' : 'State name'}
            <input
              autoFocus
              value={handoffName}
              maxLength={100}
              onChange={(event) => {
                setHandoffName(event.target.value);
                setHandoffCopied('');
              }}
            />
          </label>
          <pre className="handoff-prompt">{handoffPrompt}</pre>
          <div className="handoff-footer">
            <Button variant="outline" onClick={() => setHandoff(null)}>
              Cancel
            </Button>
            <Button
              disabled={!handoffName.trim()}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(handoffPrompt);
                  setHandoffCopied('Copied. Paste into your coding agent.');
                } catch {
                  setHandoffCopied(
                    'Copy unavailable. Select the brief above and copy it manually.',
                  );
                }
              }}
            >
              Copy agent prompt
            </Button>
          </div>
          <p role="status">{handoffCopied}</p>
        </Dialog>
      )}
      {forking && (
        <Dialog
          title="Create an independent alternative"
          busy={saving}
          onClose={() => {
            if (!saving) setForking(false);
          }}
        >
          <p className="dialog-intro">
            Keep the original. Give this direction its own space to evolve.
          </p>
          <form noValidate className="fork-form" onSubmit={fork}>
            {forkError && (
              <p id="alternative-error" role="alert">
                {forkError}
              </p>
            )}
            <label>
              Alternative name
              <input
                ref={alternativeName}
                aria-invalid={Boolean(forkError) && !title.trim()}
                aria-describedby={forkError ? 'alternative-error' : undefined}
                autoFocus
                required
                maxLength={100}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label>
              Description
              <input
                maxLength={500}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            <label>
              Design rationale (optional)
              <textarea
                className="resize-none"
                rows={3}
                maxLength={2000}
                value={rationale}
                onChange={(event) => setRationale(event.target.value)}
              />
            </label>
            <div className="alternative-assurance">
              <GitBranch size={16} />
              <p>
                The complete exploration is copied, with a link to its parent. The original stays
                unchanged. Feedback starts empty.
              </p>
            </div>
            <div className="form-actions">
              <Button
                variant="ghost"
                type="button"
                disabled={saving}
                onClick={() => setForking(false)}
              >
                Cancel
              </Button>
              <Button disabled={saving} type="submit">
                {saving ? 'Creating…' : 'Create alternative'}
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
