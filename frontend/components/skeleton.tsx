import { cn } from '@/lib/cn';
import { bookCard } from './book-card';
import { Card } from './card';

/** A shimmering placeholder box; give it the size of what it stands in for. */
export function Skeleton({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded-sm bg-[linear-gradient(90deg,var(--surface-muted)_25%,var(--border)_50%,var(--surface-muted)_75%)] bg-[length:200%_100%] motion-reduce:[animation-duration:3s]',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Same boxes as BookCard, so the grid does not change height when the Books arrive. */
function BookCardSkeleton() {
  return (
    <Card className={bookCard.card} aria-hidden="true">
      <Skeleton className="aspect-[2/3] w-full" />
      <div className={bookCard.body}>
        <Skeleton className={bookCard.title}>&nbsp;</Skeleton>
        <Skeleton className={bookCard.meta}>&nbsp;</Skeleton>
        <Skeleton className={bookCard.meta}>&nbsp;</Skeleton>
      </div>
      <div className={bookCard.actions}>
        <Skeleton className="h-10" />
      </div>
    </Card>
  );
}

export function BookGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] sm:gap-4"
      role="status"
      aria-label="Loading books"
    >
      {Array.from({ length: count }, (_, index) => (
        <BookCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function RowsSkeleton({
  count = 3,
  rowClassName = 'h-12',
}: {
  count?: number;
  rowClassName?: string;
}) {
  return (
    <div className="grid gap-3" role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className={rowClassName} />
      ))}
    </div>
  );
}
