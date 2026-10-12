'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/cn';

type ToastKind = 'success' | 'error';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface Toasts {
  success: (message: string) => void;
  error: (message: string) => void;
}

const MAX_TOASTS = 3;
const LIFETIME_MS: Record<ToastKind, number> = { success: 4000, error: 8000 };

const ToastContext = createContext<Toasts | null>(null);

/** Shows short outcome messages in the corner; place it once, near the root. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++;
      setToasts((current) =>
        [...current, { id, kind, message }].slice(-MAX_TOASTS),
      );
      setTimeout(() => dismiss(id), LIFETIME_MS[kind]);
    },
    [dismiss],
  );

  const value = useMemo<Toasts>(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message),
    }),
    [push],
  );

  return (
    <ToastContext value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-4 bottom-4 z-50 grid w-[min(380px,calc(100vw-2rem))] gap-2"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map(({ id, kind, message }) => (
          <div
            key={id}
            className={cn(
              'pointer-events-auto flex animate-toast-in items-start gap-3 rounded-md border border-l-4 border-line bg-surface px-4 py-3 text-ink shadow-dialog motion-reduce:animate-none',
              kind === 'success' ? 'border-l-accent' : 'border-l-danger',
            )}
            role={kind === 'error' ? 'alert' : 'status'}
          >
            <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
              {message}
            </span>
            <button
              type="button"
              className="size-6 flex-none cursor-pointer rounded-sm text-xl leading-none text-muted hover:bg-subtle hover:text-ink"
              aria-label="Dismiss"
              onClick={() => dismiss(id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext>
  );
}

export function useToast(): Toasts {
  const toasts = useContext(ToastContext);
  if (!toasts) throw new Error('useToast must be used inside ToastProvider');
  return toasts;
}
