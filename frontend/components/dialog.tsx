import { cn } from '@/lib/cn';

/** Classes for a native <dialog> shown with showModal(). */
export const dialogClass =
  'w-[min(480px,calc(100vw-2rem))] rounded-lg border border-line bg-surface p-0 text-ink shadow-dialog backdrop:bg-black/50';

/** Head, scrolling body and foot stacked inside a dialog. */
export function DialogFrame({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'grid max-h-[min(640px,calc(100dvh-2rem))] grid-rows-[auto_minmax(0,1fr)_auto]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DialogHead({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-1 px-4 pt-6 pb-3 sm:px-6">{children}</div>;
}

export function DialogBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid content-start gap-2 overflow-y-auto px-4 py-2 sm:px-6">
      {children}
    </div>
  );
}

export function DialogFoot({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end gap-2 border-t border-line px-4 py-4 sm:px-6">
      {children}
    </div>
  );
}
