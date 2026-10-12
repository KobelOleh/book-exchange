'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Suspense, useState } from 'react';
import { BookCard } from '@/components/book-card';
import { BookList } from '@/components/book-list';
import { Button } from '@/components/button';
import { FormCard } from '@/components/card';
import { Field, FormActions, FormGrid, Input } from '@/components/input';
import { useToast } from '@/components/toast';
import { EmptyState, ErrorAlert, PageHeader, Section } from '@/components/ui';
import { api } from '@/lib/api';
import { useBooks, useRemoveBook } from '@/lib/books';
import type { Book } from '@/lib/types';
import { useListParams } from '@/lib/use-list-params';

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

      <FormCard
        onSubmit={(event) => {
          event.preventDefault();
          add.mutate();
        }}
      >
        <FormGrid>
          <Field label="Name">
            <Input
              type="text"
              required
              maxLength={200}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Author">
            <Input
              type="text"
              required
              maxLength={200}
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </Field>
          <Field label="Photo URL">
            <Input
              type="url"
              required
              placeholder="https://…"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
            />
          </Field>
        </FormGrid>
        <ErrorAlert error={add.error} />
        <FormActions>
          <Button type="submit" loading={add.isPending}>
            Add book
          </Button>
        </FormActions>
      </FormCard>

      <Section title="Your collection" count={books.data?.total}>
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
      </Section>
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
