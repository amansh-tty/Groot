import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  CopyPlus,
  FileCode2,
  Monitor,
  PanelRightClose,
  PanelRightOpen,
  RefreshCw,
  Smartphone,
} from 'lucide-react';
import {
  elementContextSchema,
  prototypeConfigSchema,
  type ElementContext,
  type Feedback,
  type PrototypeConfig,
} from '@playground/shared';
import { api, apiUrl, type Catalog, type Detail } from './workbench-api';
import { ControlsPanel } from './ControlsPanel';
import { CompareView } from './CompareView';
import { ExplorationTree, explorationFamily } from './ExplorationTree';
import { FeedbackPanel } from './FeedbackPanel';
import { Button } from './components/ui/button';
export function PrototypeView({
  id,
  catalog,
  onOpen,
  onBack,
  onDraftChange,
}: {
  id: string;
  catalog: Catalog;
  onOpen: (id: string) => void;
  onBack: () => void;
  onDraftChange: (dirty: boolean) => void;
}) {
  const demoFolder =
    new URLSearchParams(location.search).get('example') === 'nova' ? 'demos/' : 'workspace/demos/';
  const [detail, setDetail] = useState<Detail | null>(null);
  const [config, setConfig] = useState<PrototypeConfig>({
    screens: [],
    states: [],
    viewport: 'desktop',
  });
  const [screen, setScreen] = useState('');
  const [state, setState] = useState('default');
  const [viewport, setViewport] = useState('desktop');
  const [panel, setPanel] = useState(true);
  const [frame, setFrame] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [controlsMode, setControlsMode] = useState(false);
  const [controlsDirty, setControlsDirty] = useState(false);
  const controlDraft = useRef<Record<string, number> | null>(null);
  const [comparing, setComparing] = useState(false);
  const [description, setDescription] = useState('');
  const [rationale, setRationale] = useState('');
  const [forking, setForking] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [commentMode, setCommentMode] = useState(false);
  const [target, setTarget] = useState<ElementContext | null>(null);
  const [feedbackItems, setFeedbackItems] = useState<Feedback[]>([]);
  const [activeFeedback, setActiveFeedback] = useState('');
  const [feedbackNotice, setFeedbackNotice] = useState('');
  const feedbackState = useRef({ enabled: commentMode, items: feedbackItems });
  feedbackState.current = { enabled: commentMode, items: feedbackItems };
  const iframe = useRef<HTMLIFrameElement>(null);
  const selection = useRef({ screen, state });
  selection.current = { screen, state };
  useEffect(() => {
    setFrame('');
    setControlsMode(false);
    setControlsDirty(false);
    controlDraft.current = null;
    setCommentMode(false);
    setTarget(null);
    setFeedbackItems([]);
    setActiveFeedback('');
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
      setError('Enter an alternative name.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const result = await api<{ id: string }>('/demos/' + id + '/fork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, rationale }),
      });
      setForking(false);
      onOpen(result.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create alternative.');
    } finally {
      setSaving(false);
    }
  }
  if (comparing)
    return <CompareView id={id} catalog={catalog} onClose={() => setComparing(false)} />;
  return (
    <div className="prototype-page">
      <div className="prototype-heading">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back to gallery"
          onClick={() => {
            if (allowNavigation()) onBack();
          }}
        >
          <ArrowLeft />
        </Button>
        <div>
          <h1>{detail?.meta.title ?? meta?.title ?? 'Loading exploration…'}</h1>
          <span>
            {detail?.meta.author ?? meta?.author} <span className="separator">/</span> NOVA DENTAL
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setTitle((detail?.meta.title ?? 'Booking') + ' — Alternative');
            if (!allowNavigation()) return;
            setDescription('');
            setRationale('');
            setForking(true);
          }}
        >
          <CopyPlus />
          Create alternative
        </Button>
      </div>
      {forking && (
        <form noValidate className="fork-form" onSubmit={fork}>
          <label>
            Alternative name
            <input
              autoFocus
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label>
            Description
            <input
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label>
            Design rationale (optional)
            <textarea
              rows={3}
              maxLength={2000}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              style={{ resize: 'none' }}
            />
          </label>
          <p>
            A new folder will be created in <code>{demoFolder}</code>. Your original stays intact.
          </p>
          <div>
            <Button disabled={saving} type="submit">
              {saving ? 'Creating…' : 'Create alternative'}
            </Button>
            <Button
              variant="ghost"
              type="button"
              disabled={saving}
              onClick={() => setForking(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
      <div className="preview-toolbar">
        <label className="alternative-picker">
          Exploration
          <select
            aria-label="Exploration"
            value={id}
            onChange={(e) => {
              if (allowNavigation()) onOpen(e.target.value);
            }}
          >
            {!related.some((d) => d.id === id) && (
              <option value={id}>{detail?.meta.title ?? id}</option>
            )}
            {related.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </label>
        <div className="viewport-switch">
          <Button
            aria-label="Desktop viewport"
            aria-pressed={viewport === 'desktop'}
            variant="ghost"
            size="icon"
            onClick={() => setViewport('desktop')}
          >
            <Monitor />
          </Button>
          <Button
            aria-label="Mobile viewport"
            aria-pressed={viewport === 'mobile'}
            variant="ghost"
            size="icon"
            onClick={() => setViewport('mobile')}
          >
            <Smartphone />
          </Button>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            if (allowNavigation()) {
              setComparing(true);
              setCommentMode(false);
            }
          }}
        >
          Compare
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={!config.controls}
          aria-pressed={controlsMode}
          title={
            !config.controls
              ? 'This exploration does not declare editable properties.'
              : 'Edit appointment slot cards'
          }
          onClick={() => {
            if (allowNavigation()) {
              setControlsMode(!controlsMode);
              controlDraft.current = null;
              setPanel(true);
            }
          }}
        >
          Controls
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-pressed={commentMode}
          onClick={() => {
            setCommentMode(!commentMode);
            setPanel(true);
            setTarget(null);
          }}
        >
          Comment
        </Button>
        <span className="preview-status" role="status">
          {loading ? 'Compiling…' : error ? 'Needs attention' : 'Live · watching files'}
        </span>
        <Button
          aria-label="Refresh preview"
          variant="ghost"
          size="icon"
          onClick={() => {
            setError('');
            setRefresh((x) => x + 1);
          }}
        >
          <RefreshCw />
        </Button>
        <Button
          aria-label={panel ? 'Hide inspector' : 'Show inspector'}
          variant="ghost"
          size="icon"
          onClick={() => {
            if (allowNavigation()) setPanel(!panel);
          }}
        >
          {panel ? <PanelRightClose /> : <PanelRightOpen />}
        </Button>
      </div>
      {error && (
        <div className="preview-error" role="alert">
          <strong>Preview needs attention</strong>
          <pre>{error}</pre>
          {frame && (
            <span>
              The previous compiled preview remains below. Fix the source and save to retry.
            </span>
          )}
        </div>
      )}
      <div className={'preview-layout ' + (!panel ? 'inspector-hidden' : '')}>
        <div className={'preview-canvas ' + viewport}>
          <div className="preview-frame-wrap">
            {frame ? (
              <iframe
                ref={iframe}
                title="Interactive prototype"
                key={id}
                src={frame}
                sandbox="allow-scripts"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="preview-placeholder">
                {loading
                  ? 'Preparing your exploration…'
                  : 'No working preview yet. Check the source file.'}
              </div>
            )}
          </div>
          <div className="canvas-caption">
            {viewport === 'mobile' ? '390 px · Mobile' : 'Responsive desktop'}
            <span>Fictional data · Local prototype</span>
          </div>
        </div>
        {
          <aside className="inspector" hidden={!panel}>
            {config.controls && (
              <div hidden={!controlsMode}>
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
            <ExplorationTree
              catalog={catalog}
              id={id}
              onOpen={(next) => {
                if (allowNavigation()) onOpen(next);
              }}
            />
            {detail?.meta.rationale && (
              <div className="inspector-section">
                <h2>Design rationale</h2>
                <p>{detail.meta.rationale}</p>
              </div>
            )}
            <div className="inspector-section">
              <h2>Flow & states</h2>
              <label>
                Screen
                <select
                  aria-label="Preview screen"
                  value={screen}
                  onChange={(e) => setScreen(e.target.value)}
                >
                  <option value="">Start of flow</option>
                  {config.screens.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                State
                <select
                  aria-label="Preview state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                >
                  {!config.states.length && <option value="default">Default</option>}
                  {config.states.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <p>Declared in prototype.config.ts. Jump to a scenario, then interact normally.</p>
            </div>
            <div className="inspector-section">
              <h2>
                <FileCode2 size={14} />
                Source
              </h2>
              <code>
                {demoFolder}
                {id}/src/App.tsx
              </code>
              <p>Edit this file with your coding agent. Saved changes appear here automatically.</p>
            </div>
            {feedbackNotice && <p role="status">{feedbackNotice}</p>}
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
            <details className="inspector-section">
              <summary>Assumptions & notes</summary>
              <pre>{detail?.readme}</pre>
            </details>
          </aside>
        }
      </div>
    </div>
  );
}
