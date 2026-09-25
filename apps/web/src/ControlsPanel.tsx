import { useEffect, useRef, useState } from 'react';
import type { Controls } from '@playground/shared';
import { api } from './workbench-api';
import { Button } from './components/ui/button';
type Snapshot = { document: Controls; version: string };
const valuesOf = (snapshot: Snapshot) =>
  Object.fromEntries(snapshot.document.controls.map((c) => [c.id, c.value]));
export function ControlsPanel({
  id,
  revision,
  onPreview,
  onDirty,
  onScreen,
}: {
  id: string;
  revision: number;
  onPreview: (values: Record<string, number>) => void;
  onDirty: (dirty: boolean) => void;
  onScreen: (screen: string) => void;
}) {
  const [base, setBase] = useState<Snapshot | null>(null);
  const [values, setValues] = useState<Record<string, number>>({});
  const [undo, setUndo] = useState<Record<string, number> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [conflict, setConflict] = useState(false);
  const dirty = !!base && base.document.controls.some((c) => values[c.id] !== c.value);
  const current = useRef({ base, dirty, busy });
  current.current = { base, dirty, busy };
  const callbacks = useRef({ onPreview, onDirty });
  callbacks.current = { onPreview, onDirty };
  const epoch = useRef(0);
  function accept(next: Snapshot) {
    setBase(next);
    setValues(valuesOf(next));
    setConflict(false);
    callbacks.current.onPreview(valuesOf(next));
  }
  useEffect(() => {
    let cancelled = false;
    const stamp = epoch.current;
    api<Snapshot>('/demos/' + id + '/controls')
      .then((next) => {
        if (cancelled || epoch.current !== stamp || current.current.busy) return;
        if (current.current.dirty) {
          if (next.version !== current.current.base?.version) setConflict(true);
          return;
        }
        if (next.version !== current.current.base?.version) accept(next);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id, revision]);
  useEffect(() => {
    callbacks.current.onDirty(dirty);
  }, [dirty]);
  useEffect(() => () => callbacks.current.onDirty(false), []);
  useEffect(() => {
    if (!dirty) return;
    function beforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);
  async function persist(nextValues: Record<string, number>, isUndo = false) {
    if (!base) return;
    setBusy(true);
    setError('');
    epoch.current++;
    try {
      const next = await api<Snapshot>('/demos/' + id + '/controls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: base.version, values: nextValues }),
      });
      setUndo(isUndo ? null : valuesOf(base));
      accept(next);
      setNotice(isUndo ? 'Last change undone in controls.json.' : 'Saved to controls.json.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save controls.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="inspector-section controls-panel" aria-label="Designer controls">
      <h2>{base?.document.area || 'Designer controls'}</h2>
      <p>Changes preview immediately. Save changes to share them with your coding agent.</p>
      {base && (
        <Button size="sm" variant="outline" onClick={() => onScreen(base.document.screen)}>
          Show appointment slots
        </Button>
      )}
      {error && <p role="alert">{error}</p>}
      {conflict && (
        <p role="alert">
          Controls changed externally. Your preview is unsaved. Reload to use the file values.
        </p>
      )}
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void persist(values);
        }}
      >
        {base?.document.controls.map((c) => (
          <div className="control-field" key={c.id}>
            <label htmlFor={'control-' + c.id}>
              {c.label}
              <output>
                {values[c.id]} {c.unit}
              </output>
            </label>
            <input
              id={'control-' + c.id}
              type={c.type === 'slider' ? 'range' : 'number'}
              min={c.min}
              max={c.max}
              step={c.step}
              value={values[c.id] ?? c.value}
              disabled={busy}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (!Number.isFinite(value) || value < c.min || value > c.max) return;
                const next = { ...values, [c.id]: value };
                setValues(next);
                onPreview(next);
                setNotice('Unsaved preview');
              }}
            />
          </div>
        ))}
        <div className="feedback-actions">
          <Button size="sm" type="submit" disabled={!dirty || busy || conflict}>
            {busy ? 'Saving…' : 'Save changes'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            type="button"
            disabled={!dirty || busy}
            onClick={() => {
              if (base) {
                accept(base);
                setNotice('Preview reverted.');
              }
            }}
          >
            Discard preview
          </Button>
          <Button
            size="sm"
            variant="ghost"
            type="button"
            disabled={!undo || dirty || busy}
            onClick={() => {
              if (undo) void persist(undo, true);
            }}
          >
            Undo last change
          </Button>
        </div>
      </form>
      {(error || conflict) && (
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={async () => {
            try {
              const next = await api<Snapshot>('/demos/' + id + '/controls');
              accept(next);
              setUndo(null);
              setError('');
            } catch {
              setError('Cannot read controls.json. Check the file.');
            }
          }}
        >
          Reload file values
        </Button>
      )}
      <p role="status">{notice}</p>
      <code>demos/{id}/controls.json</code>
    </section>
  );
}
