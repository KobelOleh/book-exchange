'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { Book } from './types';

export function useMyBooks() {
  return useQuery({
    queryKey: ['books', { mine: true }],
    queryFn: () => api<Book[]>('/books?mine=true'),
  });
}

/** Deletes a Book after confirmation and refreshes every book list. */
export function useRemoveBook() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: string) => api(`/books/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['books'] }),
  });

  return {
    error: mutation.error,
    isRemoving: (id: string) => mutation.isPending && mutation.variables === id,
    isBusy: mutation.isPending,
    confirmAndRemove: (book: Book) => {
      if (confirm(`Remove “${book.name}”?`)) mutation.mutate(book.id);
    },
  };
}
