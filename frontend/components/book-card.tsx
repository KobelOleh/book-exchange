import type { ExchangeBook } from '@/lib/types';

export function BookCard({
  book,
  subtitle,
  children,
}: {
  book: ExchangeBook;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <article className="card book">
      {/* eslint-disable-next-line @next/next/no-img-element -- photo URLs come from users */}
      <img src={book.photoUrl} alt={`Cover of ${book.name}`} loading="lazy" />
      <span className="title">{book.name}</span>
      <span className="muted">{book.author}</span>
      {subtitle && <span className="muted">{subtitle}</span>}
      {children && <div className="actions">{children}</div>}
    </article>
  );
}
