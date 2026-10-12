'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { BookCard } from '@/components/book-card';
import { Button } from '@/components/button';
import {
  BookGridSkeleton,
  EmptyState,
  ErrorAlert,
  PageHeader,
} from '@/components/ui';
import { api } from '@/lib/api';
import type { Book } from '@/lib/types';

export default function MyBooksPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [author, setAuthor] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const books = useQuery({
    queryKey: ['books', { mine: true }],
    queryFn: () => api<Book[]>('/books?mine=true'),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['books'] });

  const add = useMutation({
    mutationFn: () =>
      api<Book>('/books', { method: 'POST', body: { name, author, photoUrl } }),
    onSuccess: async () => {
      setName('');
      setAuthor('');
      setPhotoUrl('');
      await refresh();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/books/${id}`, { method: 'DELETE' }),
    onSuccess: refresh,
  });

  return (
    <>
      <PageHeader
        title="My books"
        subtitle="Books you list here can be requested by other readers."
      />

      <form
        className="card form"
        onSubmit={(event) => {
          event.preventDefault();
          add.mutate();
        }}
      >
        <div className="form-grid">
          <label className="field">
            Name
            <input
              className="input"
              type="text"
              required
              maxLength={200}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="field">
            Author
            <input
              className="input"
              type="text"
              required
              maxLength={200}
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </label>
          <label className="field">
            Photo URL
            <input
              className="input"
              type="url"
              required
              placeholder="https://…"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
            />
          </label>
        </div>
        <ErrorAlert error={add.error} />
        <div className="form__actions">
          <Button type="submit" loading={add.isPending}>
            Add book
          </Button>
        </div>
      </form>

      <section className="section">
        <div className="section__title">
          <h2>Your collection</h2>
          {books.data && <span className="count">{books.data.length}</span>}
        </div>
        <ErrorAlert error={books.error ?? remove.error} />
        {books.isPending && <BookGridSkeleton count={4} />}
        {books.data?.length === 0 && (
          <EmptyState title="No books yet">
            Add your first book with the form above.
          </EmptyState>
        )}
        {books.data && books.data.length > 0 && (
          <div className="book-grid">
            {books.data.map((book) => (
              <BookCard key={book.id} book={book}>
                <Button
                  variant="danger"
                  loading={remove.isPending && remove.variables === book.id}
                  disabled={remove.isPending}
                  onClick={() => {
                    if (confirm(`Remove “${book.name}”?`)) {
                      remove.mutate(book.id);
                    }
                  }}
                >
                  Remove
                </Button>
              </BookCard>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
