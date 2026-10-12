import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** Look shared by text inputs and selects. */
export const controlClass =
  'min-h-10 w-full rounded-sm border border-line-strong bg-surface px-3 font-normal text-ink placeholder:text-muted enabled:hover:border-muted disabled:cursor-not-allowed disabled:opacity-60';

export function Input({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...rest} />;
}

/** A label above a control. */
export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}

/** Fields side by side, wrapping as the space shrinks. */
export function FormGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
      {children}
    </div>
  );
}

/** Buttons at the foot of a form; full width on phones. */
export function FormActions({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-2 max-sm:*:w-full">{children}</div>;
}
