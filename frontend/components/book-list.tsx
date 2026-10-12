'use client';

import type { UseQueryResult } from '@tanstack/react-query';
import { Fragment, useEffect, useRef } from 'react';
import { BOOKS_PAGE_SIZE } from '@/lib/books';
import { cn } from '@/lib/cn';
import type { Book, Page } from '@/lib/types';
import { Pager } from './pager';
import { BookGridSkeleton } from './skeleton';
import { ErrorAlert } from './ui';

/**
 * A page of Book cards plus the pager. When there is more than one page the grid
 * is padded with invisible cards to a full page, so the pager stays put on a short last page.
 */
export function BookList({
  query,
  page,
  onPageChange,
  empty,
  renderBook,
}: {
  query: UseQueryResult<Page<Book>>;
  page: number;
  onPageChange: (page: number) => void;
  empty: React.ReactNode;
  renderBook: (book: Book) => React.ReactNode;
}) {
  const top = useRef<HTMLDivElement>(null);
  const { data, isPlaceholderData } = query;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  // A page that no longer exists (last Book removed, hand-edited URL): go to the last one.
  useEffect(() => {
    if (data && !isPlaceholderData && page > totalPages) {
      onPageChange(totalPages);
    }
  }, [data, isPlaceholderData, page, totalPages, onPageChange]);

  function changePage(next: number) {
    onPageChange(next);
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    top.current?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }

  const books = data?.items ?? [];
  const padding =
    totalPages > 1 ? Math.max(0, BOOKS_PAGE_SIZE - books.length) : 0;

  return (
    // scroll-mt keeps the top of the list clear of the sticky nav after scrolling to it.
    <div ref={top} className="grid scroll-mt-20 gap-6">
      <ErrorAlert error={query.error} />
      {query.isPending && <BookGridSkeleton count={BOOKS_PAGE_SIZE} />}
      {data && data.total === 0 && empty}
      {books.length > 0 && (
        <div
          className={cn(
            'grid grid-cols-2 gap-3 transition-opacity sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] sm:gap-4',
            isPlaceholderData && 'opacity-55',
          )}
          aria-busy={isPlaceholderData || undefined}
        >
          {books.map((book) => (
            <Fragment key={book.id}>{renderBook(book)}</Fragment>
          ))}
          {/* Invisible copies of a card that fill a short last page. */}
          {Array.from({ length: padding }, (_, index) => (
            <div
              key={`pad-${index}`}
              className="pointer-events-none invisible"
              aria-hidden="true"
              inert
            >
              {renderBook(books[0])}
            </div>
          ))}
        </div>
      )}
      {data && data.total > 0 && (
        <Pager page={page} totalPages={totalPages} onChange={changePage} />
      )}
    </div>
  );
}
