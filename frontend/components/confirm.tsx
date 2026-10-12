'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Button } from './button';
import { DialogFoot, DialogFrame, DialogHead, dialogClass } from './dialog';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Confirm | null>(null);

/** Replaces window.confirm with a styled dialog; place it once, near the root. */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<{
    options: ConfirmOptions;
    resolve: (confirmed: boolean) => void;
  } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  const confirm = useCallback<Confirm>(
    (options) =>
      new Promise((resolve) => {
        setPending({ options, resolve });
      }),
    [],
  );

  useEffect(() => {
    if (pending) dialog.current?.showModal();
  }, [pending]);

  function settle(confirmed: boolean) {
    pending?.resolve(confirmed);
    setPending(null);
  }

  return (
    <ConfirmContext value={confirm}>
      {children}
      {pending && (
        <dialog
          ref={dialog}
          className={`${dialogClass} max-w-105`}
          aria-labelledby="confirm-title"
          onClose={() => settle(false)}
          onClick={(event) => {
            // A click on the backdrop lands on the dialog element itself.
            if (event.target === dialog.current) dialog.current?.close();
          }}
        >
          <DialogFrame>
            <DialogHead>
              <h2 id="confirm-title">{pending.options.title}</h2>
              <p className="text-muted">{pending.options.message}</p>
            </DialogHead>
            <DialogFoot>
              <Button
                variant="secondary"
                onClick={() => dialog.current?.close()}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={() => settle(true)}>
                {pending.options.confirmLabel ?? 'Confirm'}
              </Button>
            </DialogFoot>
          </DialogFrame>
        </dialog>
      )}
    </ConfirmContext>
  );
}

export function useConfirm(): Confirm {
  const confirm = useContext(ConfirmContext);
  if (!confirm)
    throw new Error('useConfirm must be used inside ConfirmProvider');
  return confirm;
}
