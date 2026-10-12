import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { controlClass } from './input';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  compact?: boolean;
};

/** A native select (keeps keyboard and screen reader behaviour) with our own chevron. */
export function Select({ compact, className, children, ...rest }: SelectProps) {
  return (
    <span className={cn('relative', compact ? 'inline-block' : 'block')}>
      <select
        className={cn(
          controlClass,
          'cursor-pointer appearance-none pr-9 focus-visible:outline-offset-1 disabled:cursor-not-allowed',
          compact && 'min-h-8 w-auto',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m5 7.5 5 5 5-5" />
      </svg>
    </span>
  );
}
