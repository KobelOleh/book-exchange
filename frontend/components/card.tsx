import { cn } from '@/lib/cn';

/** Surface with a border and shadow; the base of every boxed block. */
export function Card({
  as: Tag = 'div',
  className,
  ...rest
}: React.ComponentPropsWithoutRef<'div'> & {
  as?: 'div' | 'article' | 'form';
}) {
  return (
    <Tag
      className={cn(
        'rounded-md border border-line bg-surface shadow-card',
        className,
      )}
      {...(rest as object)}
    />
  );
}

/** A Card laid out as a vertical form; use as="div" for a form-sized message. */
export function FormCard({
  as = 'form',
  className,
  ...rest
}: React.ComponentPropsWithoutRef<'div'> & { as?: 'div' | 'form' }) {
  return (
    <Card
      as={as}
      className={cn('grid gap-4 p-4 sm:p-6', className)}
      {...rest}
    />
  );
}
