export function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="page-header">
      <div className="page-header__text">
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {children}
    </header>
  );
}

export function ErrorAlert({ error }: { error: Error | null }) {
  if (!error) return null;
  return (
    <p className="alert" role="alert">
      {error.message}
    </p>
  );
}

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <p className="empty__title">{title}</p>
      {children && <p className="muted">{children}</p>}
    </div>
  );
}

/** Same boxes as BookCard, so the grid does not change height when the Books arrive. */
function BookCardSkeleton() {
  return (
    <div className="card book-card" aria-hidden="true">
      <div className="skeleton cover" />
      <div className="book-card__body">
        <p className="book-card__title skeleton">&nbsp;</p>
        <p className="book-card__meta skeleton">&nbsp;</p>
        <p className="book-card__meta skeleton">&nbsp;</p>
      </div>
      <div className="book-card__actions">
        <span className="skeleton skeleton--button" />
      </div>
    </div>
  );
}

export function BookGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="book-grid" role="status" aria-label="Loading books">
      {Array.from({ length: count }, (_, index) => (
        <BookCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function RowsSkeleton({
  count = 3,
  rowClassName = 'skeleton--row',
}: {
  count?: number;
  rowClassName?: string;
}) {
  return (
    <div className="record-list" role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={`skeleton ${rowClassName}`} />
      ))}
    </div>
  );
}
