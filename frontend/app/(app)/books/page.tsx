'use client';

import { Suspense, useEffect, useState } from 'react';
import { BookCard } from '@/components/book-card';
import { BookList } from '@/components/book-list';
import { Button } from '@/components/button';
import { RequestDialog } from '@/components/request-dialog';
import { Input } from '@/components/input';
import { Count, EmptyState, PageHeader } from '@/components/ui';
import { useMe } from '@/lib/auth';
import { useBooks, useRemoveBook } from '@/lib/books';
import type { Book } from '@/lib/types';
import { useListParams } from '@/lib/use-list-params';
import { useDebounced } from '@/lib/use-debounced';

function BrowseBooks() {
  const { data: me } = useMe();
  const { page, search, setPage, setSearch } = useListParams();
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounced(searchInput.trim());
  const [requesting, setRequesting] = useState<Book | null>(null);

  // Typing updates the URL after a short pause; the URL is the source of truth for the query.
  useEffect(() => {
    if (debouncedSearch !== search) setSearch(debouncedSearch);
  }, [debouncedSearch, search, setSearch]);

  const books = useBooks({ page, search });
  const remove = useRemoveBook();
  const total = books.data?.total;

  return (
    <>
      <PageHeader
        title="Browse books"
        subtitle="Find a book you want and offer some of yours in return."
      />
      <div className="flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="search">
          Search books
        </label>
        <Input
          id="search"
          className="flex-[1_1_260px] sm:max-w-105"
          type="search"
          placeholder="Search by name or author"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        {total !== undefined && (
          <Count aria-live="polite">
            {total} {total === 1 ? 'book' : 'books'}
          </Count>
        )}
      </div>

      <BookList
        query={books}
        page={page}
        onPageChange={setPage}
        empty={
          <EmptyState
            title={search ? `No books match “${search}”` : 'No books yet'}
          >
            {search
              ? 'Try a different name or author.'
              : 'Books listed by readers will show up here.'}
          </EmptyState>
        }
        renderBook={(book) => {
          const isOwn = book.ownerId === me?.id;
          return (
            <BookCard
              book={book}
              href={`/books/${book.id}`}
              owner={isOwn ? 'You' : book.owner.name}
            >
              {isOwn ? (
                <Button variant="secondary" disabled>
                  Your book
                </Button>
              ) : (
                <Button onClick={() => setRequesting(book)}>Request</Button>
              )}
              {me?.role === 'ADMIN' && !isOwn && (
                <Button
                  variant="danger"
                  loading={remove.isRemoving(book.id)}
                  disabled={remove.isBusy}
                  onClick={() => remove.confirmAndRemove(book)}
                >
                  Remove
                </Button>
              )}
            </BookCard>
          );
        }}
      />
      {requesting && (
        <RequestDialog book={requesting} onClose={() => setRequesting(null)} />
      )}
    </>
  );
}

export default function BrowsePage() {
  return (
    <Suspense>
      <BrowseBooks />
    </Suspense>
  );
}
