import { useEffect, useRef, useState } from 'react';
import { prototypeConfigSchema, type PrototypeConfig } from '@playground/shared';
import { api, type Catalog } from './workbench-api';
import { Button } from './components/ui/button';

function ComparePane({
  id,
  side,
  catalog,
  onChange,
}: {
  id: string;
  side: string;
  catalog: Catalog;
  onChange: (id: string) => void;
}) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const [config, setConfig] = useState<PrototypeConfig>({
    screens: [],
    states: [],
    viewport: 'desktop',
  });
  const [screen, setScreen] = useState('');
  const [state, setState] = useState('default');
  const [frame, setFrame] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState({ screen: '', state: 'default' });
  const selection = useRef({ screen, state });
  selection.current = { screen, state };
  const meta = catalog.demos.find((d) => d.id === id);
  useEffect(() => {
    setFrame('');
    setScreen('');
    setState('default');
    setConfig({ screens: [], states: [], viewport: 'desktop' });
  }, [id]);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api<{ html?: string; error?: string; revision: number }>('/demos/' + id + '/preview')
      .then((result) => {
        if (cancelled) return;
        if (result.error) setError(result.error);
        else setFrame('/api/demos/' + id + '/frame?revision=' + result.revision);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, catalog.revision]);
  useEffect(() => {
    function receive(event: MessageEvent) {
      if (
        event.source !== iframe.current?.contentWindow ||
        event.data?.channel !== 'playground-preview'
      )
        return;
      if (event.data.type === 'ready') {
        const parsed = prototypeConfigSchema.safeParse(event.data.config);
        if (parsed.success) setConfig(parsed.data);
        iframe.current?.contentWindow?.postMessage(
          { channel: 'playground-host', type: 'select', ...selection.current },
          '*',
        );
      }
      if (event.data.type === 'error') setError(String(event.data.message).slice(0, 2000));
      if (event.data.type === 'location')
        setLocation({
          screen: String(event.data.screen || 'Start'),
          state: String(event.data.state || 'default'),
        });
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
  return (
    <section className="compare-pane" aria-label={side + ' comparison'}>
      <header>
        <label>
          {side} exploration
          <select
            aria-label={side + ' exploration'}
            value={id}
            onChange={(e) => onChange(e.target.value)}
          >
            {catalog.demos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </label>
        <p>{meta?.description}</p>
        <p className="compare-rationale">
          <strong>Rationale</strong> {meta?.rationale || 'No rationale recorded.'}
        </p>
        <small>
          {meta?.author} · {meta?.platform} · {meta?.parentId ? 'Alternative' : 'Base exploration'}
        </small>
      </header>
      <div className="compare-scenarios">
        <label>
          Screen
          <select
            aria-label={side + ' screen'}
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
            aria-label={side + ' state'}
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
      </div>
      {error && (
        <p role="alert" className="preview-error">
          {error}
        </p>
      )}
      <span className="compare-location" role="status">
        {loading ? 'Compiling…' : 'Now: ' + (location.screen || 'Start') + ' · ' + location.state}
      </span>
      <div className="compare-frame">
        {frame ? (
          <iframe
            key={id}
            ref={iframe}
            title={side + ' interactive prototype'}
            src={frame}
            sandbox="allow-scripts"
            referrerPolicy="no-referrer"
          />
        ) : (
          <p>Preparing exploration…</p>
        )}
      </div>
    </section>
  );
}
export function CompareView({
  id,
  catalog,
  onClose,
}: {
  id: string;
  catalog: Catalog;
  onClose: () => void;
}) {
  const [left, setLeft] = useState(id);
  const [right, setRight] = useState(
    catalog.demos.find(
      (d) => d.id !== id && d.parentId === catalog.demos.find((x) => x.id === id)?.parentId,
    )?.id ??
      catalog.demos.find((d) => d.id !== id)?.id ??
      id,
  );
  return (
    <div className="comparison">
      <div className="comparison-heading">
        <div>
          <h1>Compare experiences</h1>
          <p>
            Interact with each exploration independently. Screen and state controls are separate.
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close comparison
        </Button>
      </div>
      <div className="compare-grid">
        <ComparePane id={left} side="Left" catalog={catalog} onChange={setLeft} />
        <ComparePane id={right} side="Right" catalog={catalog} onChange={setRight} />
      </div>
    </div>
  );
}
