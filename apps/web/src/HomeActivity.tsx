import { useEffect, useState } from 'react';
import { ArrowUpRight, GitPullRequest, Gauge, RefreshCw } from 'lucide-react';
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
const repository = 'https://github.com/amansh-tty/Groot';

function windowName(minutes: number) {
  if (minutes === 10080) return 'Weekly';
  if (minutes % 60 === 0) return `${minutes / 60}-hour`;
  return `${minutes}-minute`;
}

export function HomeActivity({ projectName }: { projectName: string }) {
  const [pulls, setPulls] = useState<Pull[] | null>(null);
  const [pullError, setPullError] = useState('');
  const [allowance, setAllowance] = useState<Allowance | null>(null);
  const [allowanceError, setAllowanceError] = useState('');
  const [reading, setReading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setPullError('');
    const read = publicDemo
      ? fetch(
          'https://api.github.com/repos/amansh-tty/Groot/pulls?state=all&sort=updated&direction=desc&per_page=20',
          {
            signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]),
            credentials: 'omit',
            headers: { Accept: 'application/vnd.github+json' },
          },
        ).then(async (response) => {
          if (!response.ok) throw new Error();
          return response.json();
        })
      : api<unknown>('/contributions');
    read
      .then((value: unknown) => {
        if (controller.signal.aborted) return;
        if (!Array.isArray(value)) throw new Error();
        const valid = value.filter(
          (item): item is Pull =>
            item &&
            Number.isInteger(item.number) &&
            typeof item.title === 'string' &&
            typeof item.html_url === 'string' &&
            /^https:\/\/github\.com\/amansh-tty\/Groot\/pull\/\d+$/.test(item.html_url) &&
            ['open', 'closed'].includes(item.state) &&
            (item.merged_at === null || typeof item.merged_at === 'string'),
        );
        if (valid.length !== value.length) throw new Error();
        setPulls(valid);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setPullError('Couldn’t refresh GitHub activity. View pull requests on GitHub or retry.');
      });
    return () => controller.abort();
  }, [refresh]);
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
    <section className="home-activity" aria-label="Workspace activity">
      <header className="home-project-heading">
        <div>
          <span className="section-label">Workspace</span>
          <h1>{projectName}</h1>
        </div>
      </header>
      <div className="home-activity-grid">
        <section className="activity-panel" aria-labelledby="contribution-title">
          <header>
            <h2 id="contribution-title">
              <GitPullRequest size={17} />
              PR contributions
            </h2>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Refresh pull requests"
              onClick={() => setRefresh(refresh + 1)}
            >
              <RefreshCw size={15} />
            </Button>
          </header>
          <div className="activity-source">
            <a href={repository + '/pulls'} target="_blank" rel="noreferrer">
              amansh-tty/Groot <ArrowUpRight size={13} />
            </a>
            <span>Public repository · Groot development</span>
          </div>
          {pullError && (
            <p role="status" className="activity-message">
              {pullError}
            </p>
          )}
          {pulls ? (
            <>
              <div className="activity-counts" aria-label="Latest twenty pull requests">
                <span>
                  <b>{pulls.filter((pull) => pull.state === 'open').length}</b> open
                </span>
                <span>
                  <b>{pulls.filter((pull) => pull.merged_at).length}</b> merged
                </span>
                <span>Latest {pulls.length} PRs</span>
              </div>
              {pulls.length ? (
                <ul className="activity-pr-list">
                  {pulls.slice(0, 3).map((pull) => (
                    <li key={pull.number}>
                      <a href={pull.html_url} target="_blank" rel="noreferrer">
                        <span className="activity-pr-number">#{pull.number}</span>
                        <span>{pull.title}</span>
                        <span className="activity-pr-state">
                          {pull.merged_at ? 'Merged' : pull.state === 'open' ? 'Open' : 'Closed'}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="activity-message">No pull requests yet.</p>
              )}
            </>
          ) : (
            !pullError && (
              <p role="status" className="activity-message">
                Loading pull requests…
              </p>
            )
          )}
        </section>
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
      </div>
    </section>
  );
}
