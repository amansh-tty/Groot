import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

/** A local disclosure, anchored to its own trigger and rendered above the canvas. */
export function PromptExcerpt({
  title,
  text,
  label = 'Prompt',
}: {
  title: string;
  text: string;
  label?: string;
}) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const long = text.length > 140 || text.split('\n').length > 2;
  useEffect(() => {
    const position = () => {
      const node = panel.current;
      const anchor = trigger.current;
      if (!node || !anchor || !node.matches(':popover-open')) return;
      const box = anchor.getBoundingClientRect();
      const item =
        anchor.closest('.variation-summary, .prompt-history article')?.getBoundingClientRect() ??
        box;
      const width = Math.min(380, window.innerWidth - 32);
      node.style.width = width + 'px';
      node.style.maxHeight = Math.min(520, window.innerHeight - 32) + 'px';
      const height = node.getBoundingClientRect().height;
      const beside = item.right + 16 + width <= window.innerWidth - 16;
      node.style.left =
        Math.max(
          16,
          Math.min(beside ? item.right + 16 : item.left, window.innerWidth - width - 16),
        ) + 'px';
      node.style.top =
        Math.max(
          16,
          Math.min(beside ? box.top - 16 : box.bottom + 8, window.innerHeight - height - 16),
        ) + 'px';
    };
    const node = panel.current;
    node?.addEventListener('toggle', position);
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    return () => {
      node?.removeEventListener('toggle', position);
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
    };
  }, [long]);
  return (
    <div className="prompt-excerpt">
      <p className={long ? 'is-condensed' : ''}>{text}</p>
      {long && (
        <>
          <button
            ref={trigger}
            type="button"
            className="prompt-more"
            popoverTarget={id}
            aria-label={`See more: ${title}`}
          >
            See more
          </button>
          <div
            ref={panel}
            id={id}
            popover="auto"
            className="prompt-popover"
            role="region"
            aria-label={`${title} — ${label}`}
          >
            <header>
              <div>
                <span className="section-label">{label}</span>
                <h3>{title}</h3>
              </div>
              <button
                type="button"
                popoverTarget={id}
                popoverTargetAction="hide"
                aria-label="Close full prompt"
              >
                <X size={16} />
              </button>
            </header>
            <div className="prompt-full-text">{text}</div>
          </div>
        </>
      )}
    </div>
  );
}
