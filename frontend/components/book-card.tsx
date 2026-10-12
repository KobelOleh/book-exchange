import Link from 'next/link';
import type { ExchangeBook } from '@/lib/types';
import { BookCover } from './book-cover';
import { Card } from './card';

/** Shared with BookCardSkeleton so loading and loaded cards have the same boxes. */
export const bookCard = {
  card: 'flex h-full min-w-0 flex-col gap-3 p-3',
  body: 'flex min-w-0 flex-col gap-1',
  // Two lines are reserved so one-line titles do not shift what follows.
  title:
    'line-clamp-2 min-h-[2.6em] text-base leading-[1.3] font-semibold [overflow-wrap:anywhere]',
  meta: 'truncate text-sm text-muted',
  actions: 'mt-auto flex gap-2 *:min-w-0 *:flex-1',
};

/** Fixed-structure card: cover, two-line title, one-line meta, actions pinned to the bottom. */
export function BookCard({
  book,
  owner,
  href,
  children,
}: {
  book: ExchangeBook;
  owner?: string;
  /** Where the cover and title lead, when the card is a link to the Book's page. */
  href?: string;
  children?: React.ReactNode;
}) {
  const cover = <BookCover url={book.photoUrl} title={book.name} />;
  return (
    <Card as="article" className={bookCard.card}>
      {href ? (
        <Link href={href} className="block" tabIndex={-1} aria-hidden="true">
          {cover}
        </Link>
      ) : (
        cover
      )}
      <div className={bookCard.body}>
        <h3 className={bookCard.title} title={book.name}>
          {href ? (
            <Link
              href={href}
              className="text-inherit no-underline hover:underline"
            >
              {book.name}
            </Link>
          ) : (
            book.name
          )}
        </h3>
        <p className={bookCard.meta} title={book.author}>
          {book.author}
        </p>
        {owner && (
          <p className={bookCard.meta} title={owner}>
            Owner: {owner}
          </p>
        )}
      </div>
      {children && <div className={bookCard.actions}>{children}</div>}
    </Card>
  );
}

/** Compact book line for lists inside other records. */
export function BookRow({ book }: { book: ExchangeBook }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <BookCover
        url={book.photoUrl}
        title={book.name}
        showLabel={false}
        className="w-10 flex-none"
      />
      <div className="grid min-w-0">
        <span className="truncate text-sm font-semibold" title={book.name}>
          {book.name}
        </span>
        <span className="truncate text-xs text-muted">{book.author}</span>
      </div>
    </div>
  );
}
