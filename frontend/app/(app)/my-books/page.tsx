'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { BookCard } from '@/components/book-card';
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
      <h1>My books</h1>
      <form
        className="card stack"
        onSubmit={(event) => {
          event.preventDefault();
          add.mutate();
        }}
      >
        <label>
          Name
          <input
            type="text"
            required
            maxLength={200}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Author
          <input
            type="text"
            required
            maxLength={200}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
        </label>
        <label>
          Photo URL
          <input
            type="url"
            required
            placeholder="https://…"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
          />
        </label>
        {add.error && <p className="error">{add.error.message}</p>}
        <div>
          <button type="submit" disabled={add.isPending}>
            Add book
          </button>
        </div>
      </form>

      <h2>Your collection</h2>
      {books.isPending && <p className="muted">Loading…</p>}
      {books.error && <p className="error">{books.error.message}</p>}
      {books.data?.length === 0 && (
        <p className="muted">You have not listed any books yet.</p>
      )}
      {remove.error && <p className="error">{remove.error.message}</p>}
      <div className="grid">
        {books.data?.map((book) => (
          <BookCard key={book.id} book={book}>
            <button
              className="danger"
              disabled={remove.isPending}
              onClick={() => {
                if (confirm(`Remove “${book.name}”?`)) remove.mutate(book.id);
              }}
            >
              Remove
            </button>
          </BookCard>
        ))}
      </div>
    </>
  );
}
