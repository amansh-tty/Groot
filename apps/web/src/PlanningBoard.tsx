import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Hand,
  MousePointer2,
  Plus,
  Save,
  Undo2,
  ZoomIn,
  ZoomOut,
  Link2,
  Trash2,
  Home,
  StickyNote,
} from 'lucide-react';
import { api, publicDemo, requestLocalSetup } from './workbench-api';
import { Button } from './components/ui/button';
import { Dialog } from './components/ui/dialog';

type Node = { id: string; x: number; y: number; text: string };
type Board = {
  id: string;
  title: string;
  nodes: Node[];
  edges: { id: string; from: string; to: string }[];
};
type Saved = { board: Board; version: string };
const uid = () => 'item-' + crypto.randomUUID().slice(0, 8);
const bounded = (value: number, max: number) => Math.max(0, Math.min(max, Math.round(value)));
function connectionPath(a: Node, b: Node) {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const fraction = Math.min(dx ? 130 / Math.abs(dx) : Infinity, dy ? 80 / Math.abs(dy) : Infinity);
  const offset = Number.isFinite(fraction) ? Math.min(0.48, fraction) : 0;
  return (
    'M ' +
    (a.x + 130 + dx * offset) +
    ' ' +
    (a.y + 80 + dy * offset) +
    ' L ' +
    (b.x + 130 - dx * offset) +
    ' ' +
    (b.y + 80 - dy * offset)
  );
}
export function PlanningBoard({
  id,
  onDraftChange,
}: {
  id: string;
  onDraftChange?: (dirty: boolean) => void;
}) {
  const [saved, setSaved] = useState<Saved | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [undo, setUndo] = useState<Board[]>([]);
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 64, y: 64 });
  const [selected, setSelected] = useState('');
  const [tool, setTool] = useState('select');
  const [from, setFrom] = useState('');
  const [leaving, setLeaving] = useState('');
  const [help, setHelp] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const current = useRef(board);
  current.current = board;
  const drag = useRef<{
    id: string;
    x: number;
    y: number;
    left: number;
    top: number;
    initial: Board;
  } | null>(null);
  const panning = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const dirty = !!board && JSON.stringify(board) !== JSON.stringify(saved?.board);
  const notify = useRef(onDraftChange);
  notify.current = onDraftChange;
  useEffect(() => {
    notify.current?.(dirty);
    return () => notify.current?.(false);
  }, [dirty]);
  useEffect(() => {
    const blocked = () => setError('Save or discard your board changes before navigating.');
    window.addEventListener('groot:board-navigation-blocked', blocked);
    return () => window.removeEventListener('groot:board-navigation-blocked', blocked);
  }, []);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  useEffect(() => {
    let active = true;
    const read = () =>
      api<Saved>('/boards/' + id)
        .then((value) => {
          if (active && !dirtyRef.current) {
            setSaved(value);
            setBoard(value.board);
            setError('');
          }
        })
        .catch((reason: Error) => {
          if (active) setError(reason.message);
        });
    void read();
    const timer = setInterval(() => {
      if (!dirtyRef.current) void read();
    }, 4000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [id]);
  useEffect(() => {
    document.title = (board?.title ?? 'Planning board') + ' — Groot';
  }, [board?.title]);
  useEffect(() => {
    if (!dirty) return;
    const guard = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current) event.preventDefault();
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [dirty]);
  function update(next: Board, remember = true) {
    if (!board || busy) return;
    if (remember) setUndo((items) => [...items.slice(-39), board]);
    setBoard(next);
    setMessage('');
  }
  function addCard() {
    if (!board || board.nodes.length >= 60) return;
    const bounds = viewport.current?.getBoundingClientRect();
    const node = {
      id: uid(),
      x: bounded(
        ((bounds?.width ?? 800) / 2 - pan.x) / zoom - 130 + (board.nodes.length % 3) * 300,
        3740,
      ),
      y: bounded(
        ((bounds?.height ?? 600) / 2 - pan.y) / zoom - 80 + (board.nodes.length % 5) * 32,
        2840,
      ),
      text: '',
    };
    update({ ...board, nodes: [...board.nodes, node] });
    setSelected(node.id);
    setTool('select');
  }
  function removeCard() {
    if (!board || !selected) return;
    update({
      ...board,
      nodes: board.nodes.filter((node) => node.id !== selected),
      edges: board.edges.filter((edge) => edge.from !== selected && edge.to !== selected),
    });
    setSelected('');
  }
  async function save() {
    if (!board || !saved || busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await api<Saved>('/boards/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board, version: saved.version }),
      });
      setSaved(result);
      setBoard(result.board);
      setMessage('Board saved');
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const projectUrl = location.pathname + location.search + '#page=all';
  function leave(url: string) {
    if (dirty) setLeaving(url);
    else location.assign(url);
  }
  return (
    <div className="planning-board-page">
      <header className="board-header">
        <Button variant="ghost" size="icon" aria-label="Home" onClick={() => leave('/?home=1')}>
          <Home />
        </Button>
        <Button variant="ghost" onClick={() => leave(projectUrl)}>
          <ArrowLeft size={15} />
          Project
        </Button>
        {board && (
          <input
            aria-label="Board title"
            maxLength={100}
            value={board.title}
            disabled={busy}
            onChange={(event) => update({ ...board, title: event.target.value })}
          />
        )}
        <span role="status">
          {busy ? 'Saving…' : dirty ? 'Unsaved changes' : message || 'Saved locally'}
        </span>
        <Button variant="outline" onClick={() => setHelp(true)}>
          Agent handoff
        </Button>
        <Button disabled={!dirty || busy || !board?.title.trim()} onClick={() => void save()}>
          <Save size={15} />
          {busy ? 'Saving…' : 'Save board'}
        </Button>
      </header>
      {error && (
        <div className="board-error" role="alert">
          {error}
          {board && (
            <Button variant="outline" onClick={() => setLeaving('reload')}>
              Reload saved board
            </Button>
          )}
        </div>
      )}
      <div className="board-toolbar" role="toolbar" aria-label="Planning board tools">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Select cards"
          aria-pressed={tool === 'select'}
          onClick={() => {
            setTool('select');
            setFrom('');
          }}
        >
          <MousePointer2 />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Pan canvas"
          aria-pressed={tool === 'pan'}
          onClick={() => setTool('pan')}
        >
          <Hand />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Add text card"
          disabled={!board || board.nodes.length >= 60 || busy}
          onClick={addCard}
        >
          <Plus />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Connect cards"
          aria-pressed={tool === 'connect'}
          disabled={!board || board.nodes.length < 2}
          onClick={() => {
            setTool('connect');
            setFrom('');
          }}
        >
          <Link2 />
        </Button>
        <span />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Undo board change"
          disabled={!undo.length || busy}
          onClick={() => {
            const value = undo[undo.length - 1];
            if (value) {
              setBoard(value);
              setUndo(undo.slice(0, -1));
              setMessage('Change undone');
            }
          }}
        >
          <Undo2 />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Delete selected card"
          disabled={!selected || busy}
          onClick={removeCard}
        >
          <Trash2 />
        </Button>
      </div>
      <div
        ref={viewport}
        className={'board-viewport tool-' + tool}
        tabIndex={0}
        aria-label="Planning canvas"
        onPointerDown={(event) => {
          if ((tool === 'pan' || event.button === 1) && event.target === event.currentTarget) {
            panning.current = { x: event.clientX, y: event.clientY, left: pan.x, top: pan.y };
            event.currentTarget.setPointerCapture(event.pointerId);
            event.preventDefault();
          }
        }}
        onPointerMove={(event) => {
          const start = panning.current;
          if (start)
            setPan({
              x: start.left + event.clientX - start.x,
              y: start.top + event.clientY - start.y,
            });
        }}
        onPointerUp={() => {
          panning.current = null;
        }}
        onPointerCancel={() => {
          panning.current = null;
        }}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          const moves: Record<string, [number, number]> = {
            ArrowLeft: [40, 0],
            ArrowRight: [-40, 0],
            ArrowUp: [0, 40],
            ArrowDown: [0, -40],
          };
          const move = moves[event.key];
          if (move) {
            event.preventDefault();
            setPan((value) => ({ x: value.x + move[0], y: value.y + move[1] }));
          }
        }}
      >
        {board && (
          <div
            className="board-surface"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          >
            <svg
              className="board-connectors"
              width="4000"
              height="3000"
              aria-label="Card connections"
            >
              <defs>
                <marker
                  id="board-arrow"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
                </marker>
              </defs>
              {board.edges.map((edge) => {
                const a = board.nodes.find((node) => node.id === edge.from)!,
                  b = board.nodes.find((node) => node.id === edge.to)!;
                return (
                  <g key={edge.id}>
                    <path d={connectionPath(a, b)} markerEnd="url(#board-arrow)" />
                    <title>
                      {a.text.slice(0, 60) || 'Empty card'} → {b.text.slice(0, 60) || 'Empty card'}
                    </title>
                  </g>
                );
              })}
            </svg>
            {board.nodes.map((node, index) => (
              <article
                className={
                  'board-card' +
                  (selected === node.id ? ' selected' : '') +
                  (from === node.id ? ' connecting' : '')
                }
                key={node.id}
                style={{ left: node.x, top: node.y }}
                onClick={() => {
                  setSelected(node.id);
                  if (tool === 'connect') {
                    if (!from) setFrom(node.id);
                    else if (from !== node.id) {
                      if (
                        !board.edges.some((edge) => edge.from === from && edge.to === node.id) &&
                        board.edges.length < 120
                      )
                        update({
                          ...board,
                          edges: [...board.edges, { id: uid(), from, to: node.id }],
                        });
                      setFrom('');
                      setTool('select');
                    }
                  }
                }}
              >
                <button
                  className="board-card-handle"
                  aria-label={'Move card ' + (index + 1)}
                  disabled={busy}
                  onFocus={() => setSelected(node.id)}
                  onPointerDown={(event) => {
                    if (tool !== 'select') return;
                    setSelected(node.id);
                    drag.current = {
                      id: node.id,
                      x: event.clientX,
                      y: event.clientY,
                      left: node.x,
                      top: node.y,
                      initial: board,
                    };
                    event.currentTarget.setPointerCapture(event.pointerId);
                  }}
                  onPointerMove={(event) => {
                    const start = drag.current;
                    if (!start || start.id !== node.id || !current.current) return;
                    setBoard({
                      ...current.current,
                      nodes: current.current.nodes.map((value) =>
                        value.id === node.id
                          ? {
                              ...value,
                              x: bounded(start.left + (event.clientX - start.x) / zoom, 3740),
                              y: bounded(start.top + (event.clientY - start.y) / zoom, 2840),
                            }
                          : value,
                      ),
                    });
                  }}
                  onPointerUp={() => {
                    if (drag.current) {
                      const initial = drag.current.initial;
                      setUndo((values) => [...values.slice(-39), initial]);
                      drag.current = null;
                    }
                  }}
                  onPointerCancel={() => {
                    if (drag.current) {
                      setBoard(drag.current.initial);
                      drag.current = null;
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Delete') {
                      event.preventDefault();
                      removeCard();
                      return;
                    }
                    const moves: Record<string, [number, number]> = {
                      ArrowLeft: [-1, 0],
                      ArrowRight: [1, 0],
                      ArrowUp: [0, -1],
                      ArrowDown: [0, 1],
                    };
                    const move = moves[event.key];
                    if (move) {
                      event.preventDefault();
                      const step = event.shiftKey ? 32 : 8;
                      update({
                        ...board,
                        nodes: board.nodes.map((value) =>
                          value.id === node.id
                            ? {
                                ...value,
                                x: bounded(value.x + move[0] * step, 3740),
                                y: bounded(value.y + move[1] * step, 2840),
                              }
                            : value,
                        ),
                      });
                    }
                  }}
                >
                  <span>Card {index + 1}</span>
                  <span>⋮⋮</span>
                </button>
                <textarea
                  aria-label={'Card ' + (index + 1) + ' text'}
                  placeholder="Write an idea…"
                  value={node.text}
                  maxLength={2000}
                  disabled={busy}
                  onFocus={() => setSelected(node.id)}
                  onChange={(event) =>
                    update({
                      ...board,
                      nodes: board.nodes.map((value) =>
                        value.id === node.id ? { ...value, text: event.target.value } : value,
                      ),
                    })
                  }
                />
              </article>
            ))}
          </div>
        )}
        {board && !board.nodes.length && (
          <div className="board-empty">
            <StickyNote size={30} />
            <h1>Start your plan</h1>
            <p>Add a text card, or give this board to your coding agent.</p>
            <Button onClick={addCard}>Add your first card</Button>
          </div>
        )}
        {!board && !error && (
          <p className="board-empty" role="status">
            Opening board…
          </p>
        )}
      </div>
      <div className="board-zoom">
        <Button
          variant="ghost"
          aria-label="Fit planning board"
          disabled={!board?.nodes.length}
          onClick={() => {
            if (!board?.nodes.length || !viewport.current) return;
            const box = viewport.current.getBoundingClientRect();
            const left = Math.min(...board.nodes.map((node) => node.x)),
              top = Math.min(...board.nodes.map((node) => node.y));
            const width = Math.max(...board.nodes.map((node) => node.x + 260)) - left,
              height = Math.max(...board.nodes.map((node) => node.y + 160)) - top;
            const scale = Math.max(
              0.05,
              Math.min(1, (box.width - 120) / width, (box.height - 100) / height),
            );
            setZoom(scale);
            setPan({
              x: box.width / 2 - (left + width / 2) * scale,
              y: box.height / 2 - (top + height / 2) * scale,
            });
          }}
        >
          Fit
        </Button>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Zoom out board"
          disabled={zoom <= 0.05}
          onClick={() => setZoom((value) => Math.max(0.05, value - 0.1))}
        >
          <ZoomOut />
        </Button>
        <span>{Math.round(zoom * 100)}%</span>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Zoom in board"
          disabled={zoom >= 1.5}
          onClick={() => setZoom((value) => Math.min(1.5, value + 0.1))}
        >
          <ZoomIn />
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setPan({ x: 64, y: 64 });
            setZoom(0.8);
          }}
        >
          Reset view
        </Button>
      </div>
      {board && board.edges.length > 0 && (
        <details className="board-connections">
          <summary>Connections ({board.edges.length})</summary>
          {board.edges.map((edge, index) => (
            <div key={edge.id}>
              <span>
                {(board.nodes.find((node) => node.id === edge.from)?.text || 'Empty card').slice(
                  0,
                  40,
                )}{' '}
                →{' '}
                {(board.nodes.find((node) => node.id === edge.to)?.text || 'Empty card').slice(
                  0,
                  40,
                )}
              </span>
              <button
                disabled={busy}
                aria-label={'Remove connection ' + (index + 1)}
                onClick={() =>
                  update({ ...board, edges: board.edges.filter((item) => item.id !== edge.id) })
                }
              >
                Remove
              </button>
            </div>
          ))}
        </details>
      )}
      <p className="board-instruction" role="status">
        {tool === 'connect'
          ? from
            ? 'Select a second card to connect.'
            : 'Select the first card to connect.'
          : 'Drag cards by their headers. Arrow keys move focused cards; arrow keys on the canvas pan.'}
      </p>
      {leaving && (
        <Dialog
          title={leaving === 'reload' ? 'Reload saved board?' : 'Leave this board?'}
          onClose={() => setLeaving('')}
        >
          <p>Your unsaved changes will be discarded.</p>
          <div className="dialog-actions">
            <Button variant="outline" onClick={() => setLeaving('')}>
              Keep editing
            </Button>
            <Button
              onClick={() => {
                dirtyRef.current = false;
                setBoard(saved?.board ?? null);
                setTimeout(() => {
                  if (leaving === 'reload') location.reload();
                  else location.assign(leaving);
                }, 0);
              }}
            >
              Discard changes
            </Button>
          </div>
        </Dialog>
      )}
      {help && (
        <Dialog title="Work on this board with your agent" onClose={() => setHelp(false)}>
          <p>Save your changes first. Give this instruction to your existing coding agent.</p>
          <pre className="board-agent-prompt">
            Read this project’s context. Update boards/{id}.json with this product plan. Preserve
            the board ID and existing card IDs, use only the documented JSON fields, and keep
            assumptions distinct from verified information. Do not change prototype source files.
          </pre>
          <p>Groot loads saved changes automatically while this board has no unsaved edits.</p>
        </Dialog>
      )}
    </div>
  );
}

export function ProjectBoards() {
  const [items, setItems] = useState<{ id: string; title: string; cards: number }[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let current = true;
    const read = () =>
      api<{ boards: typeof items; warnings: string[] }>('/boards')
        .then((value) => {
          if (current) {
            setItems(value.boards);
            setWarnings(value.warnings);
          }
        })
        .catch((reason: Error) => {
          if (current) setError(reason.message);
        });
    void read();
    const timer = publicDemo ? undefined : setInterval(() => void read(), 4000);
    return () => {
      current = false;
      clearInterval(timer);
    };
  }, []);
  return (
    <section className="project-boards">
      <header>
        <h2>
          Planning boards <span>{items.length}</span>
        </h2>
        <Button
          variant="outline"
          disabled={!publicDemo && new URLSearchParams(location.search).get('example') === 'nova'}
          onClick={() => (publicDemo ? requestLocalSetup() : setCreating(true))}
        >
          <Plus size={15} />
          New board
        </Button>
      </header>
      {error && <p role="alert">{error}</p>}
      {warnings.map((warning) => (
        <p key={warning} role="status">
          {warning}
        </p>
      ))}
      {items.length ? (
        <div className="project-board-list">
          {items.map((board) => (
            <a
              key={board.id}
              href={'#board=' + board.id}
              onClick={(event) => {
                event.preventDefault();
                location.assign(location.pathname + location.search + '#board=' + board.id);
              }}
            >
              <StickyNote size={22} />
              <strong>{board.title}</strong>
              <span>{board.cards} cards</span>
            </a>
          ))}
        </div>
      ) : (
        <p className="panel-hint">A space for product plans, journeys and connected ideas.</p>
      )}
      {creating && (
        <Dialog
          title="New planning board"
          busy={busy}
          onClose={() => {
            if (!busy) setCreating(false);
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
                const board = await api<{ id: string }>('/boards', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ title: data.get('title') }),
                });
                location.assign(location.pathname + location.search + '#board=' + board.id);
                location.reload();
              } catch (reason) {
                setError((reason as Error).message);
                setBusy(false);
              }
            }}
          >
            <label>
              Board name
              <input name="title" required maxLength={100} autoFocus />
            </label>
            {error && <p role="alert">{error}</p>}
            <Button type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Create board'}
            </Button>
          </form>
        </Dialog>
      )}
    </section>
  );
}
