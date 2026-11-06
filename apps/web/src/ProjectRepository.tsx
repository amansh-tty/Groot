import { useEffect, useState } from 'react';
import { api, publicDemo, requestLocalSetup } from './workbench-api';
import { Button } from './components/ui/button';
export function ProjectRepository() {
  const [repository, setRepository] = useState('');
  const [version, setVersion] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  function load() {
    setError('');
    void api<{ repository: string; version: string }>('/project-repository')
      .then((value) => {
        setRepository(value.repository);
        setVersion(value.version);
      })
      .catch((reason: Error) => setError(reason.message));
  }
  useEffect(() => {
    if (!publicDemo) load();
  }, []);
  return (
    <section className="repository-settings">
      <h2>Project repository</h2>
      <p>Link this project’s public GitHub repository. Its PR activity appears here and on Home.</p>
      {publicDemo ? (
        <Button variant="outline" onClick={requestLocalSetup}>
          Link my repository locally
        </Button>
      ) : (
        <form
          className="project-file-form"
          onSubmit={async (event) => {
            event.preventDefault();
            if (busy) return;
            setBusy(true);
            setMessage('');
            setError('');
            try {
              const saved = await api<{ repository: string; version: string }>(
                '/project-repository',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ repository, version }),
                },
              );
              setVersion(saved.version);
              setRepository(saved.repository);
              setMessage(saved.repository ? 'Repository linked' : 'Repository unlinked');
            } catch (reason) {
              setError((reason as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            GitHub repository
            <input
              aria-label="Project GitHub repository"
              disabled={!version || busy}
              placeholder="owner/repository"
              maxLength={140}
              value={repository}
              onChange={(event) => setRepository(event.target.value)}
            />
          </label>
          <div className="dialog-actions">
            <Button type="submit" disabled={!version || busy}>
              {busy ? 'Saving…' : 'Save repository'}
            </Button>
            <Button variant="outline" disabled={busy} onClick={load}>
              Reload settings
            </Button>
          </div>
          {error && <p role="alert">{error}</p>}
          <p role="status">{message}</p>
        </form>
      )}
    </section>
  );
}
