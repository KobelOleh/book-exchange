import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Spinner } from './ui';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'md' | 'sm';
  loading?: boolean;
};

const variants = {
  primary:
    'border-transparent bg-accent text-accent-ink enabled:hover:bg-[color-mix(in_srgb,var(--accent)_85%,var(--text))]',
  secondary: 'border-line-strong bg-surface text-ink enabled:hover:bg-subtle',
  danger: 'border-danger bg-surface text-danger enabled:hover:bg-danger-soft',
};

const sizes = {
  md: 'min-h-10 px-4',
  sm: 'min-h-8 px-3',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-sm border text-sm leading-none font-semibold whitespace-nowrap transition-colors enabled:active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
