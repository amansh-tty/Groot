import { useEffect, useState } from 'react';
import { ArrowUpRight, GitPullRequest, Gauge } from 'lucide-react';
import { api, publicDemo, requestLocalSetup } from './workbench-api';
import { Button } from './components/ui/button';

type Allowance = {
  checkedAt: string;
  windows: { remainingPercent: number; windowMinutes: number; resetsAt: number | null }[];
};
type Pull = {
  number: number;
  title: string;
  html_url: string;
  state: string;
  merged_at: string | null;
};
export function AgentAllowance() {
  const [allowance, setAllowance] = useState<Allowance | null>(null);
  const [allowanceError, setAllowanceError] = useState('');
  const [reading, setReading] = useState(false);
  async function readAllowance() {
    setReading(true);
    setAllowanceError('');
    try {
      setAllowance(await api<Allowance>('/agent-allowance'));
    } catch (reason) {
      setAllowanceError((reason as Error).message);
    } finally {
      setReading(false);
    }
  }
  return (
    <section className="activity-panel" aria-labelledby="allowance-title">
      <header>
        <h2 id="allowance-title">
          <Gauge size={17} />
          Coding-agent allowance
        </h2>
        <span className="activity-pr-state">Codex · Local only</span>
      </header>
      {publicDemo ? (
        <>
          <p className="activity-message">
            Your five-hour and weekly allowance stays on your computer.
          </p>
          <Button variant="outline" onClick={requestLocalSetup}>
            Use my local allowance
            <ArrowUpRight size={14} />
          </Button>
        </>
      ) : (
        <>
          {!allowance && (
            <p className="activity-message">
              Read the allowance from your signed-in local Codex CLI. This checks limits without
              starting an agent task.
            </p>
          )}
          {allowance && (
            <div className="allowance-windows">
              {allowance.windows.map((window, index) => (
                <div key={index} className="allowance-window">
                  <div>
                    <span>{windowName(window.windowMinutes)}</span>
                    <strong>{window.remainingPercent}% remaining</strong>
                  </div>
                  <progress
                    max={100}
                    value={window.remainingPercent}
                    aria-label={windowName(window.windowMinutes) + ' allowance remaining'}
                  />
                  <span>
                    {window.resetsAt
                      ? 'Resets ' +
                        new Date(window.resetsAt * 1000).toLocaleString(undefined, {
                          weekday: 'short',
                          hour: 'numeric',
                          minute: '2-digit',
                        })
                      : 'Reset time not reported'}
                  </span>
                </div>
              ))}
            </div>
          )}
          {allowanceError && (
            <p role="alert" className="activity-message">
              {allowanceError}
              {allowance && ' Showing the last successful check.'}
            </p>
          )}
          <div className="allowance-actions">
            <Button variant="outline" disabled={reading} onClick={() => void readAllowance()}>
              {reading ? 'Checking…' : allowance ? 'Refresh allowance' : 'Read local allowance'}
            </Button>
            {allowance && (
              <span>
                Checked{' '}
                {new Date(allowance.checkedAt).toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>
        </>
      )}
    </section>
  );
}
function windowName(minutes: number) {
  return minutes === 10080
    ? 'Weekly'
    : minutes % 60 === 0
      ? minutes / 60 + '-hour'
      : minutes + '-minute';
}
export function ProjectContributions({
  repository,
  projectId,
  compact = false,
}: {
  repository: string;
  projectId?: string;
  compact?: boolean;
}) {
  const [pulls, setPulls] = useState<Pull[] | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let current = true;
    setPulls(null);
    setError('');
    if (!repository) return;
    const read = publicDemo
      ? fetch(
          'https://api.github.com/repos/' +
            repository +
            '/pulls?state=all&sort=updated&direction=desc&per_page=20',
          { credentials: 'omit', signal: AbortSignal.timeout(8000) },
        ).then(async (response) => {
          if (!response.ok) throw new Error();
          return response.json();
        })
      : api<{ pulls: unknown }>('/contributions', undefined, projectId).then(
          (value) => value.pulls,
        );
    read
      .then((value: unknown) => {
        if (!current) return;
        if (!Array.isArray(value)) throw new Error();
        const valid = value.filter(
          (item): item is Pull =>
            item &&
            Number.isInteger(item.number) &&
            typeof item.title === 'string' &&
            typeof item.html_url === 'string' &&
            item.html_url.toLowerCase() ===
              ('https://github.com/' + repository + '/pull/' + item.number).toLowerCase() &&
            ['open', 'closed'].includes(item.state) &&
            (item.merged_at === null || typeof item.merged_at === 'string'),
        );
        if (valid.length !== value.length) throw new Error();
        setPulls(valid);
      })
      .catch(() => {
        if (current) setError('GitHub activity is unavailable.');
      });
    return () => {
      current = false;
    };
  }, [repository, projectId, revision]);
  if (!repository)
    return compact ? (
      <span className="unlinked-repository">No repository linked</span>
    ) : (
      <div className="project-contributions-empty">
        <GitPullRequest size={16} />
        <span>No repository linked to this project.</span>
        <span>Link a repository in Start Here to see its PR activity.</span>
      </div>
    );
  return (
    <section
      className={'project-contributions' + (compact ? ' compact' : '')}
      aria-label={'Contributions for ' + repository}
    >
      <a href={'https://github.com/' + repository + '/pulls'} target="_blank" rel="noreferrer">
        <GitPullRequest size={15} />
        {repository}
        <ArrowUpRight size={13} />
      </a>
      {error ? (
        <div role="status">
          {error} <button onClick={() => setRevision((value) => value + 1)}>Retry</button>
        </div>
      ) : pulls ? (
        <>
          <span>
            {pulls.filter((pull) => pull.state === 'open').length} open ·{' '}
            {pulls.filter((pull) => pull.merged_at).length} merged{' '}
            <small>in latest {pulls.length} PRs</small>
          </span>
          {!compact && (
            <ul>
              {pulls.slice(0, 3).map((pull) => (
                <li key={pull.number}>
                  <a href={pull.html_url} target="_blank" rel="noreferrer">
                    #{pull.number} {pull.title}
                  </a>
                  <span>{pull.merged_at ? 'Merged' : pull.state}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <span role="status">Loading PRs…</span>
      )}
    </section>
  );
}
