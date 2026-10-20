import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';

export function Dialog({
  title,
  onClose,
  children,
  busy = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  busy?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef(document.activeElement as HTMLElement | null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => {
      node?.close();
      returnFocus.current?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="studio-dialog"
      aria-labelledby="studio-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) close.current();
      }}
      onKeyDown={(event) => {
        if (
          event.key !== 'Tab' ||
          event.ctrlKey ||
          event.metaKey ||
          event.altKey ||
          event.nativeEvent.isComposing
        )
          return;
        const items = [
          ...event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]',
          ),
        ].filter((item) => item.tabIndex >= 0 && item.getClientRects().length > 0);
        const first = items[0];
        const last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
    >
      <header>
        <h2 id="studio-dialog-title">{title}</h2>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close dialog"
          disabled={busy}
          onClick={onClose}
        >
          <X />
        </Button>
      </header>
      <div className="dialog-body">{children}</div>
    </dialog>
  );
}
