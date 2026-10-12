'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { BookCard } from '@/components/book-card';
import { RequestDialog } from '@/components/request-dialog';
import { api } from '@/lib/api';
import { useMe } from '@/lib/auth';
import type { Book } from '@/lib/types';

export default function BrowsePage() {
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [requesting, setRequesting] = useState<Book | null>(null);

  const books = useQuery({
    queryKey: ['books', { search }],
    queryFn: () =>
      api<Book[]>(`/books?search=${encodeURIComponent(search.trim())}`),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/books/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['books'] }),
  });

  return (
    <>
      <h1>Browse books</h1>
      <div className="row" style={{ marginBottom: 16 }}>
        <input
          type="search"
          placeholder="Search by name or author"
          aria-label="Search books"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 220 }}
        />
      </div>
      {books.isPending && <p className="muted">Loading…</p>}
      {books.error && <p className="error">{books.error.message}</p>}
      {books.data?.length === 0 && <p className="muted">No books found.</p>}
      {remove.error && <p className="error">{remove.error.message}</p>}
      <div className="grid">
        {books.data?.map((book) => {
          const isOwn = book.ownerId === me?.id;
          return (
            <BookCard
              key={book.id}
              book={book}
              subtitle={isOwn ? 'Yours' : `Owner: ${book.owner.name}`}
            >
              {!isOwn && (
                <button onClick={() => setRequesting(book)}>Request</button>
              )}
              {me?.role === 'ADMIN' && !isOwn && (
                <button
                  className="danger"
                  disabled={remove.isPending}
                  onClick={() => {
                    if (confirm(`Remove “${book.name}”?`))
                      remove.mutate(book.id);
                  }}
                >
                  Remove
                </button>
              )}
            </BookCard>
          );
        })}
      </div>
      {requesting && (
        <RequestDialog book={requesting} onClose={() => setRequesting(null)} />
      )}
    </>
  );
}
