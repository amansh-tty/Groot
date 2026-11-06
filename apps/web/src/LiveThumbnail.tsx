import { useEffect, useRef, useState } from 'react';
import { Layers } from 'lucide-react';
import { api, apiUrl, type Demo } from './workbench-api';

/** A small, non-interactive instance of the actual prototype, never invented artwork. */
export function LiveThumbnail({
  demo,
  revision,
  projectId,
}: {
  demo: Pick<Demo, 'id' | 'title' | 'platform'>;
  revision: number;
  projectId?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);
  const [frame, setFrame] = useState('');
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const iframe = useRef<HTMLIFrameElement>(null);
  const source = useRef('');
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.source !== iframe.current?.contentWindow ||
        event.data?.channel !== 'playground-preview'
      )
        return;
      if (event.data.type === 'ready') setReady(true);
      if (event.data.type === 'error') setFailed(true);
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, []);
  const width = demo.platform === 'mobile' ? 390 : 1440;
  useEffect(() => {
    const node = container.current;
    if (!node) return;
    const resize = new ResizeObserver(([entry]) => {
      if (entry) setScale(entry.contentRect.width / width);
    });
    resize.observe(node);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' },
    );
    observer.observe(node);
    return () => {
      resize.disconnect();
      observer.disconnect();
    };
  }, [width]);
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    api<{ error?: string; revision: number }>(
      '/demos/' + demo.id + '/preview',
      undefined,
      projectId,
    )
      .then((result) => {
        if (cancelled) return;
        setFailed(Boolean(result.error));
        if (!result.error) {
          const next = apiUrl(
            '/demos/' + demo.id + '/frame?revision=' + result.revision,
            projectId,
          );
          if (source.current !== next) {
            source.current = next;
            setReady(false);
            setFrame(next);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [demo.id, revision, visible, projectId]);
  return (
    <div ref={container} className="demo-thumbnail live-thumbnail" aria-hidden="true" inert>
      {frame ? (
        <iframe
          ref={iframe}
          title={demo.title + ' thumbnail'}
          src={frame}
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          tabIndex={-1}
          loading="lazy"
          style={{ width, height: 1024, transform: `scale(${scale})` }}
        />
      ) : (
        <div className="thumbnail-placeholder">
          <Layers size={28} />
          <span>{failed ? 'Open to view diagnostics' : 'Preparing preview…'}</span>
        </div>
      )}
      {frame && !ready && (
        <div className="thumbnail-placeholder thumbnail-loading">
          <Layers size={28} />
          <span>{failed ? 'Open to view diagnostics' : 'Preparing preview…'}</span>
        </div>
      )}
      {failed && frame && <span className="thumbnail-notice">Last working preview</span>}
    </div>
  );
}
