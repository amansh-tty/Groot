import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  FileText,
  Link2,
  Plus,
  Search,
  Presentation,
  NotebookPen,
  FolderOpen,
  X,
} from 'lucide-react';
import { api, publicDemo, requestLocalSetup, type Catalog } from './workbench-api';
import { Button } from './components/ui/button';
import { Dialog } from './components/ui/dialog';

type Kind = 'design' | 'plan' | 'presentation' | 'note';
type ProjectFile = {
  id: string;
  title: string;
  kind: Kind | 'context';
  description: string;
  url: string;
  body: string;
  relatedDemoIds: string[];
  createdAt: string;
};
type Snapshot = { files: ProjectFile[]; warnings: string[] };
const kinds = [
  { id: 'design', label: 'Design sources', name: 'Design source', Icon: Link2 },
  { id: 'plan', label: 'Plans', name: 'Plan', Icon: NotebookPen },
  { id: 'presentation', label: 'Presentations', name: 'Presentation', Icon: Presentation },
  { id: 'note', label: 'Notes', name: 'Note', Icon: FileText },
  { id: 'context', label: 'Context', name: 'Context', Icon: FolderOpen },
] as const;

export function ProjectFiles({
  catalog,
  projectName,
  onOpen,
  example,
}: {
  catalog: Catalog;
  projectName: string;
  onOpen: (id: string) => void;
  example: boolean;
}) {
  const [snapshot, setSnapshot] = useState<Snapshot>({ files: [], warnings: [] });
  const [context, setContext] = useState<{ name: string; content: string }[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ProjectFile | null>(null);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [limit, setLimit] = useState(12);
  useEffect(() => {
    let active = true;
    const read = async () => {
      try {
        const [files, documents] = await Promise.all([
          api<Snapshot>('/files'),
          api<typeof context>('/context'),
        ]);
        if (active) {
          setSnapshot(files);
          setContext(documents);
          setReady(true);
          setError('');
        }
      } catch (reason) {
        if (active) {
          setReady(true);
          setError(reason instanceof Error ? reason.message : 'Project files are unavailable.');
        }
      }
    };
    void read();
    const timer = publicDemo ? undefined : setInterval(() => void read(), 4000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [refresh]);
  useEffect(() => setLimit(12), [filter, search]);
  useEffect(() => {
    setSelected((current) => {
      if (!current) return current;
      if (current.kind === 'context') {
        const document = context.find((doc) => 'context-' + doc.name === current.id);
        return document ? { ...current, body: document.content } : null;
      }
      return snapshot.files.find((file) => file.id === current.id) ?? null;
    });
  }, [snapshot.files, context]);
  const files: ProjectFile[] = [
    ...snapshot.files,
    ...context.map((doc) => ({
      id: 'context-' + doc.name,
      title: doc.name
        .replaceAll('-', ' ')
        .toLowerCase()
        .replace(/^./, (value) => value.toUpperCase()),
      kind: 'context' as const,
      description: 'Project context',
      url: '',
      body: doc.content,
      relatedDemoIds: [],
      createdAt: '',
    })),
  ];
  const visible = files.filter(
    (file) =>
      (filter === 'all' || file.kind === filter) &&
      [file.title, file.description, file.body]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const original = catalog.demos.filter((demo) => !demo.parentId).length;
  const recent = [...catalog.demos].sort((a, b) => b.modified.localeCompare(a.modified))[0];
  function add() {
    if (publicDemo) {
      requestLocalSetup();
      return;
    }
    if (example) {
      setNotice('This example is read-only. Switch to your workspace to add project files.');
      return;
    }
    setCreating(true);
  }
  return (
    <section className="project-hub" aria-labelledby="project-hub-title">
      <div className="hub-heading">
        <div>
          <span className="section-label">{example ? 'Example workspace' : 'Your workspace'}</span>
          <h1 id="project-hub-title">{projectName}</h1>
        </div>
        <Button variant="outline" onClick={add}>
          <Plus />
          New file
        </Button>
      </div>
      <div className="hub-summary" aria-label="Project work summary">
        <span>
          <strong>{original}</strong> original {original === 1 ? 'exploration' : 'explorations'}
        </span>
        <span>
          <strong>{catalog.demos.length - original}</strong> variations
        </span>
        <span>
          <strong>{files.length}</strong> project files
        </span>
        {recent && (
          <button onClick={() => onOpen(recent.id)}>
            Continue <strong>{recent.title}</strong>
            <ArrowUpRight size={14} />
          </button>
        )}
      </div>
      <div className="hub-files-heading">
        <h2>Project files</h2>
        <label className="hub-search">
          <Search size={15} />
          <input
            aria-label="Search project files"
            placeholder="Search files…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search && (
            <button aria-label="Clear file search" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </label>
      </div>
      <nav className="file-kind-tabs" aria-label="Project file types">
        {[{ id: 'all', label: 'All files' }, ...kinds].map((kind) => (
          <button
            key={kind.id}
            aria-pressed={filter === kind.id}
            onClick={() => setFilter(kind.id)}
          >
            {kind.label}
            <span>
              {kind.id === 'all'
                ? files.length
                : files.filter((file) => file.kind === kind.id).length}
            </span>
          </button>
        ))}
      </nav>
      {error && (
        <p role="alert" className="catalog-error">
          {error} Your last loaded files remain available.{' '}
          <button onClick={() => setRefresh((value) => value + 1)}>Retry</button>
        </p>
      )}
      {snapshot.warnings.length > 0 && (
        <details className="hub-file-warnings">
          <summary>{snapshot.warnings.length} files need attention</summary>
          {snapshot.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </details>
      )}
      {!ready ? (
        <p role="status" className="hub-files-empty">
          Reading project files…
        </p>
      ) : visible.length ? (
        <div className="hub-file-grid">
          {visible.slice(0, limit).map((file) => {
            const kind = kinds.find((kind) => kind.id === file.kind)!;
            const Icon = kind.Icon;
            return (
              <button
                className="hub-file-card"
                data-kind={file.kind}
                key={file.id}
                onClick={() => setSelected(file)}
                aria-label={'Open file ' + file.title}
              >
                <div className="hub-file-cover">
                  <Icon size={25} />
                  <span>{kind.name}</span>
                </div>
                <div className="hub-file-info">
                  <strong>{file.title}</strong>
                  <span>
                    {file.description ||
                      (file.kind === 'context' ? 'Read-only source document' : 'Project document')}
                  </span>
                  <small>
                    {file.relatedDemoIds.length
                      ? `${file.relatedDemoIds.length} related ${file.relatedDemoIds.length === 1 ? 'exploration' : 'explorations'}`
                      : file.url
                        ? new URL(file.url).hostname
                        : file.kind === 'context'
                          ? 'Project context'
                          : 'Local document'}
                  </small>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="hub-files-empty">
          <p>
            {search
              ? 'No files match your search.'
              : filter === 'all'
                ? 'Keep your sources and project documents together.'
                : `No ${kinds.find((kind) => kind.id === filter)?.label.toLowerCase()} yet.`}
          </p>
          <Button variant="ghost" size="sm" onClick={search ? () => setSearch('') : add}>
            {search ? 'Clear file search' : 'Add a project file'}
          </Button>
        </div>
      )}
      {visible.length > limit && (
        <Button variant="outline" size="sm" onClick={() => setLimit((value) => value + 12)}>
          Load more files
        </Button>
      )}
      {notice && <p role="status">{notice}</p>}
      {selected && (
        <Dialog title={selected.title} onClose={() => setSelected(null)}>
          <div className="project-file-detail">
            <span className="section-label">
              {kinds.find((kind) => kind.id === selected.kind)?.name}
            </span>
            {selected.description && <p>{selected.description}</p>}
            {selected.url && (
              <a
                className="file-source-link"
                href={selected.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open original source
                <ArrowUpRight size={14} />
              </a>
            )}
            {selected.kind === 'design' && (
              <p className="context-help">
                Linked reference. Edit the design in its original tool.
              </p>
            )}
            {selected.body && <pre className="project-file-body">{selected.body}</pre>}
            {selected.relatedDemoIds.length > 0 && (
              <section>
                <h3>Related explorations</h3>
                {selected.relatedDemoIds.map((id) => {
                  const demo = catalog.demos.find((demo) => demo.id === id);
                  return demo ? (
                    <button
                      className="file-related-link"
                      key={id}
                      onClick={() => {
                        setSelected(null);
                        onOpen(id);
                      }}
                    >
                      {demo.title}
                      <ArrowUpRight size={14} />
                    </button>
                  ) : (
                    <p key={id} className="context-help">
                      {id} is no longer available.
                    </p>
                  );
                })}
              </section>
            )}
            {selected.kind !== 'context' && (
              <details>
                <summary>Update with your agent</summary>
                <p>
                  Ask your coding agent to edit <code>project-files/{selected.id}.json</code>.
                  Preserve its ID and related exploration links. This document is not a canvas or
                  slide editor.
                </p>
              </details>
            )}
          </div>
        </Dialog>
      )}
      {creating && (
        <CreateFile
          catalog={catalog}
          initialKind={
            filter === 'plan' || filter === 'presentation' || filter === 'note' ? filter : 'design'
          }
          onClose={() => setCreating(false)}
          onSaved={(file) => {
            setCreating(false);
            setSnapshot((current) => ({ ...current, files: [file, ...current.files] }));
            setNotice(file.title + ' added to project files.');
            setFilter('all');
            setSearch('');
            setRefresh((value) => value + 1);
          }}
        />
      )}
    </section>
  );
}

function CreateFile({
  catalog,
  initialKind,
  onClose,
  onSaved,
}: {
  catalog: Catalog;
  initialKind: Kind;
  onClose: () => void;
  onSaved: (file: ProjectFile) => void;
}) {
  const [kind, setKind] = useState<Kind>(initialKind);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [body, setBody] = useState('');
  const [related, setRelated] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <Dialog title="New project file" onClose={onClose} busy={busy}>
      <form
        className="project-file-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          setBusy(true);
          setError('');
          try {
            const file = await api<ProjectFile>('/files', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                kind,
                title,
                description,
                url,
                body,
                relatedDemoIds: related,
              }),
            });
            onSaved(file);
          } catch (reason) {
            setError(reason instanceof Error ? reason.message : 'Could not save the file.');
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          File type
          <select
            aria-label="File type"
            value={kind}
            onChange={(event) => setKind(event.target.value as Kind)}
          >
            {kinds
              .filter((kind) => kind.id !== 'context')
              .map((kind) => (
                <option key={kind.id} value={kind.id}>
                  {kind.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          File name
          <input
            autoFocus
            required
            maxLength={100}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={
              kind === 'design' ? 'e.g. Dashboard design source' : 'e.g. Onboarding plan'
            }
          />
        </label>
        <label>
          Description
          <input
            maxLength={300}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <label>
          Source URL {kind !== 'design' && '(optional)'}
          <input
            type="url"
            required={kind === 'design'}
            maxLength={2000}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://…"
          />
        </label>
        <label>
          {kind === 'plan' ? 'Plan content' : 'Notes'}
          <textarea
            rows={5}
            maxLength={12000}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={
              kind === 'plan'
                ? 'Goals, evidence, decisions and open questions…'
                : 'Add context for this file…'
            }
          />
        </label>
        {catalog.demos.length > 0 && (
          <label>
            Related explorations
            <select
              multiple
              aria-label="Related explorations"
              size={Math.min(4, catalog.demos.length)}
              value={related}
              onChange={(event) =>
                setRelated([...event.target.selectedOptions].map((option) => option.value))
              }
            >
              {catalog.demos.map((demo) => (
                <option value={demo.id} key={demo.id}>
                  {demo.title}
                </option>
              ))}
            </select>
            <span className="context-help">
              Choose up to 20. Use Ctrl or Command to select more than one.
            </span>
          </label>
        )}
        {error && <p role="alert">{error}</p>}
        <div className="file-form-actions">
          <Button type="button" variant="ghost" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !title.trim() || related.length > 20}>
            {busy ? 'Saving…' : 'Create file'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
