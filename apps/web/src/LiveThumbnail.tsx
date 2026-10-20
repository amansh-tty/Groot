import { useEffect, useRef, useState } from 'react';
import { Layers } from 'lucide-react';
import { api, apiUrl, type Demo } from './workbench-api';

/** A small, non-interactive instance of the actual prototype, never invented artwork. */
export function LiveThumbnail({ demo, revision }: { demo: Demo; revision: number }) {
  const container = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);
  const [frame, setFrame] = useState('');
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(false);
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
    api<{ error?: string; revision: number }>('/demos/' + demo.id + '/preview')
      .then((result) => {
        if (cancelled) return;
        setFailed(Boolean(result.error));
        if (!result.error)
          setFrame(apiUrl('/demos/' + demo.id + '/frame?revision=' + result.revision));
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [demo.id, revision, visible]);
  return (
    <div ref={container} className="demo-thumbnail live-thumbnail" aria-hidden="true" inert>
      {frame ? (
        <iframe
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
      {failed && frame && <span className="thumbnail-notice">Last working preview</span>}
    </div>
  );
}
