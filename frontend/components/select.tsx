import type { SelectHTMLAttributes } from 'react';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  compact?: boolean;
};

/** A native select (keeps keyboard and screen reader behaviour) with our own chevron. */
export function Select({ compact, className, children, ...rest }: SelectProps) {
  return (
    <span className={`select${compact ? ' select--sm' : ''}`}>
      <select
        className={[
          'input',
          'select__control',
          compact && 'input--sm',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {children}
      </select>
      <svg
        className="select__icon"
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
