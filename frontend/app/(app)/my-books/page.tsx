'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Suspense, useState } from 'react';
import { BookCard } from '@/components/book-card';
import { Button } from '@/components/button';
import { BookList } from '@/components/book-list';
import { useToast } from '@/components/toast';
import { EmptyState, ErrorAlert, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import { useBooks, useRemoveBook } from '@/lib/books';
import { useListParams } from '@/lib/use-list-params';
import type { Book } from '@/lib/types';

function MyBooks() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [author, setAuthor] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const toast = useToast();
  const { page, setPage } = useListParams();
  const books = useBooks({ page, mine: true });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['books'] });

  const add = useMutation({
    mutationFn: () =>
      api<Book>('/books', { method: 'POST', body: { name, author, photoUrl } }),
    onSuccess: async () => {
      setName('');
      setAuthor('');
      setPhotoUrl('');
      await refresh();
      toast.success('Book added');
    },
  });

  const remove = useRemoveBook();

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
          {books.data && <span className="count">{books.data.total}</span>}
        </div>
        <BookList
          query={books}
          page={page}
          onPageChange={setPage}
          empty={
            <EmptyState title="No books yet">
              Add your first book with the form above.
            </EmptyState>
          }
          renderBook={(book) => (
            <BookCard book={book} href={`/books/${book.id}`}>
              <Button
                variant="danger"
                loading={remove.isRemoving(book.id)}
                disabled={remove.isBusy}
                onClick={() => remove.confirmAndRemove(book)}
              >
                Remove
              </Button>
            </BookCard>
          )}
        />
      </section>
    </>
  );
}

export default function MyBooksPage() {
  return (
    <Suspense>
      <MyBooks />
    </Suspense>
  );
}
