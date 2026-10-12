import Link from 'next/link';
import type { ExchangeBook } from '@/lib/types';
import { BookCover } from './book-cover';

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
    <article className="card book-card">
      {href ? (
        <Link
          href={href}
          className="book-card__cover"
          tabIndex={-1}
          aria-hidden="true"
        >
          {cover}
        </Link>
      ) : (
        cover
      )}
      <div className="book-card__body">
        <h3 className="book-card__title" title={book.name}>
          {href ? (
            <Link href={href} className="book-card__link">
              {book.name}
            </Link>
          ) : (
            book.name
          )}
        </h3>
        <p className="book-card__meta" title={book.author}>
          {book.author}
        </p>
        {owner && (
          <p className="book-card__meta" title={owner}>
            Owner: {owner}
          </p>
        )}
      </div>
      {children && <div className="book-card__actions">{children}</div>}
    </article>
  );
}

/** Compact book line for lists inside other records. */
export function BookRow({ book }: { book: ExchangeBook }) {
  return (
    <div className="book-row">
      <BookCover url={book.photoUrl} title={book.name} showLabel={false} />
      <div className="book-row__text">
        <span className="book-row__title" title={book.name}>
          {book.name}
        </span>
        <span className="book-row__author">{book.author}</span>
      </div>
    </div>
  );
}
