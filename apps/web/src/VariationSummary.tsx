import { useEffect, useState } from 'react';
import { api, type Detail, type Demo } from './workbench-api';
import { PromptExcerpt } from './PromptExcerpt';

export function VariationSummary({
  item,
  original,
  current,
  detail,
  revision,
  onOpen,
}: {
  item: Demo;
  original: boolean;
  current: boolean;
  detail: Detail | null;
  revision: number;
  onOpen: () => void;
}) {
  const [saved, setSaved] = useState<Detail | null>(null);
  useEffect(() => {
    if (current) return;
    let active = true;
    api<Detail>('/demos/' + item.id)
      .then((value) => {
        if (active) setSaved(value);
      })
      .catch(() => {
        if (active) setSaved(null);
      });
    return () => {
      active = false;
    };
  }, [item.id, current, revision]);
  const record = current ? detail : saved;
  const prompt = record?.prompts?.at(-1)?.prompt;
  const text = prompt || item.description;
  const title = original ? 'Original' : item.title;
  return (
    <article className="variation-summary" data-current={current || undefined}>
      <button
        type="button"
        title={item.title}
        aria-current={current ? 'page' : undefined}
        onClick={onOpen}
      >
        <strong>{title}</strong>
        {current && <span className="variation-current">Current</span>}
      </button>
      {text && (
        <>
          <span className="variation-source">{prompt ? 'Latest prompt' : 'Direction'}</span>
          <PromptExcerpt
            title={item.title}
            text={text}
            label={prompt ? 'Latest prompt' : 'Direction'}
          />
        </>
      )}
    </article>
  );
}
