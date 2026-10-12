import { useState } from 'react';
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

/** A password input with an eye button on the right to reveal what was typed. */
export function PasswordInput({
  className,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visible, setVisible] = useState(false);
  const label = visible ? 'Hide password' : 'Show password';

  return (
    <span className="relative block">
      <Input
        className={cn('pr-11', className)}
        type={visible ? 'text' : 'password'}
        {...rest}
      />
      <button
        type="button"
        className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center rounded-sm text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-focus"
        aria-label={label}
        title={label}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
      >
        <svg
          className="size-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
          {visible && <path d="M4 4l16 16" />}
        </svg>
      </button>
    </span>
  );
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
