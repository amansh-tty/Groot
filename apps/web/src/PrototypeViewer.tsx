import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Monitor,
  Smartphone,
  MessageSquare,
  Link2,
  Pencil,
} from 'lucide-react';
import { prototypeConfigSchema, type PrototypeConfig } from '@playground/shared';
import { api, apiUrl, type Detail } from './workbench-api';
import { Button } from './components/ui/button';
import { Dialog } from './components/ui/dialog';

export function PrototypeViewer({
  id,
  title,
  revision,
  onClose,
  onEdit,
}: {
  id: string;
  title: string;
  revision: number;
  onClose: () => void;
  onEdit: () => void;
}) {
  const [frame, setFrame] = useState('');
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [config, setConfig] = useState<PrototypeConfig>({
    screens: [],
    states: [],
    viewport: 'desktop',
  });
  const [index, setIndex] = useState(0);
  const [state, setState] = useState('default');
  const [mobile, setMobile] = useState(false);
  const [comments, setComments] = useState(false);
  const [message, setMessage] = useState('');
  const [scale, setScale] = useState(0.6);
  const stage = useRef<HTMLDivElement>(null);
  const iframe = useRef<HTMLIFrameElement>(null);
  const screen = config.screens[index]?.id ?? '';
  const selection = useRef({ screen, state });
  selection.current = { screen, state };
  const width = mobile ? 390 : 1440,
    height = mobile ? 844 : 1024;
  useEffect(() => {
    let current = true;
    void Promise.all([
      api<Detail>('/demos/' + id),
      api<{ error?: string; revision: number }>('/demos/' + id + '/preview'),
    ])
      .then(([next, preview]) => {
        if (!current) return;
        setDetail(next);
        if (preview.error) setError(preview.error);
        else {
          setError('');
          setFrame(apiUrl('/demos/' + id + '/frame?revision=' + preview.revision));
        }
      })
      .catch((reason: Error) => {
        if (current) setError(reason.message);
      });
    return () => {
      current = false;
    };
  }, [id, revision]);
  useEffect(() => {
    const node = stage.current;
    if (!node) return;
    const resize = new ResizeObserver(([entry]) => {
      if (entry)
        setScale(
          Math.max(
            0.1,
            Math.min(
              1,
              (entry.contentRect.width - 112) / width,
              (entry.contentRect.height - 40) / height,
            ),
          ),
        );
    });
    resize.observe(node);
    return () => resize.disconnect();
  }, [width, height, comments]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.source !== iframe.current?.contentWindow ||
        event.data?.channel !== 'playground-preview'
      )
        return;
      if (event.data.type === 'ready') {
        const parsed = prototypeConfigSchema.safeParse(event.data.config);
        if (parsed.success) {
          setConfig(parsed.data);
          setMobile(parsed.data.viewport === 'mobile');
        }
        iframe.current?.contentWindow?.postMessage(
          { channel: 'playground-host', type: 'select', ...selection.current },
          '*',
        );
      }
      if (event.data.type === 'error' && typeof event.data.message === 'string')
        setError(event.data.message.slice(0, 2000));
    };
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
    <Dialog
      className="prototype-viewer-dialog"
      title={title}
      onClose={onClose}
      headerActions={
        <div className="viewer-header-actions">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Show prototype comments"
            aria-pressed={comments}
            onClick={() => setComments(!comments)}
          >
            <MessageSquare />
            <span>{detail?.feedback.length ?? 0}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Copy prototype link"
            onClick={() => {
              const url = new URL(location.href);
              url.hash = 'view=' + id;
              void navigator.clipboard
                .writeText(url.href)
                .then(() => setMessage('Link copied'))
                .catch(() => setMessage('Copy this link: ' + url.href));
            }}
          >
            <Link2 />
          </Button>
        </div>
      }
    >
      <div className="viewer-topline">
        <div>
          <span className="section-label">Interactive prototype</span>
          <h3>{config.screens[index]?.label || 'Preview'}</h3>
        </div>
        <div className="viewer-devices">
          <Button
            variant="ghost"
            size="icon"
            aria-label="View desktop prototype"
            aria-pressed={!mobile}
            onClick={() => setMobile(false)}
          >
            <Monitor />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="View mobile prototype"
            aria-pressed={mobile}
            onClick={() => setMobile(true)}
          >
            <Smartphone />
          </Button>
          {config.states.length > 0 && (
            <select
              aria-label="Prototype state"
              value={state}
              onChange={(event) => setState(event.target.value)}
            >
              {config.states.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      {error && (
        <details className="viewer-diagnostics">
          <summary>
            {frame
              ? 'Preview update failed. The last working preview remains.'
              : 'Preview is unavailable.'}
          </summary>
          <pre>{error}</pre>
        </details>
      )}
      <div className={'viewer-content' + (comments ? ' with-comments' : '')}>
        <div ref={stage} className="viewer-stage">
          {config.screens.length > 1 && (
            <>
              <Button
                className="viewer-prev"
                variant="outline"
                size="icon"
                aria-label="Previous prototype screen"
                disabled={index === 0}
                onClick={() => {
                  setIndex(index - 1);
                  setState('default');
                }}
              >
                <ArrowLeft />
              </Button>
              <Button
                className="viewer-next"
                variant="outline"
                size="icon"
                aria-label="Next prototype screen"
                disabled={index >= config.screens.length - 1}
                onClick={() => {
                  setIndex(index + 1);
                  setState('default');
                }}
              >
                <ArrowRight />
              </Button>
            </>
          )}
          {frame ? (
            <div
              className="viewer-artboard"
              style={{ width: width * scale, height: height * scale }}
            >
              <iframe
                ref={iframe}
                title="Prototype viewer"
                src={frame}
                sandbox="allow-scripts"
                referrerPolicy="no-referrer"
                style={{ width, height, transform: `scale(${scale})` }}
              />
            </div>
          ) : (
            <p role="status">
              {error ? 'Open the workspace to review diagnostics.' : 'Preparing preview…'}
            </p>
          )}
        </div>
        {comments && (
          <aside className="viewer-comments">
            <h3>
              Comments <span>{detail?.feedback.length ?? 0}</span>
            </h3>
            {detail?.feedback.length ? (
              detail.feedback.map((item) => (
                <article key={item.id}>
                  <span>
                    {item.status === 'resolved' ? 'Resolved' : 'Open'} · {item.screen || 'Preview'}
                  </span>
                  <p>{item.comment}</p>
                </article>
              ))
            ) : (
              <p>No comments yet.</p>
            )}
            <Button variant="outline" onClick={onEdit}>
              Comment in workspace
            </Button>
          </aside>
        )}
      </div>
      <footer className="viewer-footer">
        <span>
          {config.screens.length ? index + 1 : 1} of {Math.max(1, config.screens.length)} screens
        </span>
        <Button variant="outline" onClick={onEdit}>
          <Pencil size={15} />
          Open workspace
        </Button>
        <span>
          {mobile ? 'Mobile' : 'Desktop'} · {Math.round(scale * 100)}%
        </span>
      </footer>
      <span className="viewer-message" role="status">
        {message}
      </span>
    </Dialog>
  );
}
