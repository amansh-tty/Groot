import { useEffect, useRef, useState } from 'react';
import type { ElementContext, Feedback, FeedbackAction } from '@playground/shared';
import { api } from './workbench-api';
import { Button } from './components/ui/button';
export function FeedbackPanel({
  id,
  revision,
  target,
  activeId,
  onCancel,
  onItems,
  onFocus,
}: {
  id: string;
  revision: number;
  target: ElementContext | null;
  activeId: string;
  onCancel: () => void;
  onItems: (items: Feedback[]) => void;
  onFocus: (item: Feedback) => void;
}) {
  const [data, setData] = useState<{ items: Feedback[]; version: string }>({
    items: [],
    version: '',
  });
  const [filter, setFilter] = useState('all');
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState('');
  const [editVersion, setEditVersion] = useState('');
  const [deleting, setDeleting] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const field = useRef<HTMLTextAreaElement>(null);
  const itemsCallback = useRef(onItems);
  itemsCallback.current = onItems;
  useEffect(() => {
    let cancelled = false;
    api<typeof data>('/demos/' + id + '/feedback')
      .then((next) => {
        if (!cancelled) {
          setData(next);
          itemsCallback.current(next.items);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id, revision]);
  useEffect(() => {
    if (target) {
      setEditing('');
      setComment('');
      field.current?.focus();
    }
  }, [target]);
  useEffect(() => {
    if (activeId) {
      setFilter('all');
      document.getElementById('feedback-' + activeId)?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeId]);
  async function save(change: FeedbackAction) {
    setBusy(true);
    setError('');
    try {
      const next = await api<typeof data>('/demos/' + id + '/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: change.action === 'edit' ? editVersion : data.version,
          change,
        }),
      });
      setData(next);
      onItems(next.items);
      setEditing('');
      setDeleting('');
      setComment('');
      onCancel();
      setNotice('Feedback saved to local files.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Feedback could not be saved.');
    } finally {
      setBusy(false);
    }
  }
  const editor = (change: () => FeedbackAction) => (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (comment.trim()) void save(change());
      }}
    >
      <label htmlFor="feedback-comment">Feedback</label>
      <textarea
        id="feedback-comment"
        ref={field}
        autoFocus
        rows={5}
        maxLength={4000}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        style={{ resize: 'none' }}
      />
      <div className="feedback-actions">
        <Button size="sm" disabled={busy || !comment.trim()} type="submit">
          {busy ? 'Saving…' : 'Save feedback'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          type="button"
          disabled={busy}
          onClick={() => {
            setEditing('');
            setComment('');
            onCancel();
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
  return (
    <section className="inspector-section feedback-panel" aria-label="Feedback panel">
      <h2>
        Feedback <span>{data.items.length}</span>
      </h2>
      <p className="feedback-help">
        Turn on Comment, then click an element or focus it and press Enter. Escape exits.
      </p>
      {target && (
        <div className="feedback-composer">
          <strong>{target.label || target.element}</strong>
          <small>
            {target.screen || 'Current screen'} · {target.state}
          </small>
          {editor(() => ({ action: 'create', target, comment }))}
        </div>
      )}
      <label>
        Show feedback
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
        </select>
      </label>
      {error && (
        <p role="alert">
          {error}{' '}
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              try {
                const next = await api<typeof data>('/demos/' + id + '/feedback');
                setData(next);
                onItems(next.items);
                setEditVersion(next.version);
                setError('');
              } catch {
                setError('Still unable to read feedback. Check the local file.');
              }
            }}
          >
            Reload feedback
          </Button>
        </p>
      )}
      <span className="sr-only" role="status">
        {notice}
      </span>
      {data.items
        .filter((f) => filter === 'all' || f.status === filter)
        .map((f) => (
          <article
            id={'feedback-' + f.id}
            key={f.id}
            className={'feedback-item ' + (activeId === f.id ? 'selected' : '')}
          >
            <button className="feedback-location" onClick={() => onFocus(f)}>
              <b>{data.items.indexOf(f) + 1}</b> {f.status === 'resolved' ? '✓ Resolved' : 'Open'} ·{' '}
              {f.screen || 'Start'} · {f.state}
            </button>
            {editing === f.id ? (
              editor(() => ({ action: 'edit', id: f.id, comment }))
            ) : (
              <>
                <p>{f.comment}</p>
                <code>{f.elementId || f.element}</code>
                <div className="feedback-actions">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => {
                      onCancel();
                      setEditing(f.id);
                      setEditVersion(data.version);
                      setComment(f.comment);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() =>
                      void save({
                        action: 'status',
                        id: f.id,
                        status: f.status === 'open' ? 'resolved' : 'open',
                      })
                    }
                  >
                    {f.status === 'open' ? 'Resolve' : 'Reopen'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => setDeleting(f.id)}
                  >
                    Delete
                  </Button>
                </div>
              </>
            )}
            {deleting === f.id && (
              <div className="feedback-delete">
                <p>Delete this comment permanently?</p>
                <Button size="sm" variant="ghost" autoFocus onClick={() => setDeleting('')}>
                  Keep comment
                </Button>
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => void save({ action: 'delete', id: f.id })}
                >
                  Delete comment
                </Button>
              </div>
            )}
          </article>
        ))}
      {!data.items.some((f) => filter === 'all' || f.status === filter) && (
        <p>No {filter === 'all' ? '' : filter + ' '}feedback yet.</p>
      )}
      <p className="file-note">Saved in feedback/feedback.json</p>
    </section>
  );
}
