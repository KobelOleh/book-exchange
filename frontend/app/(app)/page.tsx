'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { BookCard } from '@/components/book-card';
import { Button } from '@/components/button';
import { RequestDialog } from '@/components/request-dialog';
import {
  BookGridSkeleton,
  EmptyState,
  ErrorAlert,
  PageHeader,
} from '@/components/ui';
import { api } from '@/lib/api';
import { useMe } from '@/lib/auth';
import { useRemoveBook } from '@/lib/books';
import type { Book } from '@/lib/types';
import { useDebounced } from '@/lib/use-debounced';

export default function BrowsePage() {
  const { data: me } = useMe();
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounced(searchInput.trim());
  const [requesting, setRequesting] = useState<Book | null>(null);

  const books = useQuery({
    queryKey: ['books', { search }],
    queryFn: () => api<Book[]>(`/books?search=${encodeURIComponent(search)}`),
    placeholderData: keepPreviousData,
  });

  const remove = useRemoveBook();

  return (
    <>
      <PageHeader
        title="Browse books"
        subtitle="Find a book you want and offer some of yours in return."
      />
      <div className="toolbar">
        <label className="sr-only" htmlFor="search">
          Search books
        </label>
        <input
          id="search"
          className="input"
          type="search"
          placeholder="Search by name or author"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        {books.data && (
          <span className="count" aria-live="polite">
            {books.data.length} {books.data.length === 1 ? 'book' : 'books'}
          </span>
        )}
      </div>

      <ErrorAlert error={books.error ?? remove.error} />
      {books.isPending && <BookGridSkeleton />}
      {books.data?.length === 0 && (
        <EmptyState
          title={search ? `No books match “${search}”` : 'No books yet'}
        >
          {search
            ? 'Try a different name or author.'
            : 'Books listed by readers will show up here.'}
        </EmptyState>
      )}
      {books.data && books.data.length > 0 && (
        <div className="book-grid">
          {books.data.map((book) => {
            const isOwn = book.ownerId === me?.id;
            return (
              <BookCard
                key={book.id}
                book={book}
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
          })}
        </div>
      )}
      {requesting && (
        <RequestDialog book={requesting} onClose={() => setRequesting(null)} />
      )}
    </>
  );
}
