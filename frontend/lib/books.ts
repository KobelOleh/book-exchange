'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useConfirm } from '@/components/confirm';
import { useToast } from '@/components/toast';
import { api } from './api';
import type { Book, Page } from './types';

/** Books per page in lists; matches the API default. */
export const BOOKS_PAGE_SIZE = 12;
/** The most Books the API returns in one page. */
export const MAX_BOOKS_LIMIT = 100;

/** One page of Books (A→Z), optionally searched or restricted to the caller's own. */
export function useBooks({
  page,
  search = '',
  mine = false,
}: {
  page: number;
  search?: string;
  mine?: boolean;
}) {
  return useQuery({
    queryKey: ['books', { page, search, mine }],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(BOOKS_PAGE_SIZE),
      });
      if (search) params.set('search', search);
      if (mine) params.set('mine', 'true');
      return api<Page<Book>>(`/books?${params}`);
    },
    // Keep the old page on screen while the next one loads, so the layout holds still.
    placeholderData: keepPreviousData,
  });
}

/** As many of the caller's own Books as the API gives in one go, for picking Offered Books. */
export function useMyBooksToOffer() {
  return useQuery({
    queryKey: ['books', 'offer'],
    queryFn: () => api<Page<Book>>(`/books?mine=true&limit=${MAX_BOOKS_LIMIT}`),
  });
}

export function useBook(id: string) {
  return useQuery({
    queryKey: ['book', id],
    queryFn: () => api<Book>(`/books/${id}`),
    retry: false,
  });
}

/** Deletes a Book after confirmation and refreshes every book list. */
export function useRemoveBook() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const toast = useToast();
  const mutation = useMutation({
    mutationFn: (id: string) => api(`/books/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['books'] }),
  });

  return {
    isRemoving: (id: string) => mutation.isPending && mutation.variables === id,
    isBusy: mutation.isPending,
    confirmAndRemove: async (book: Book, onRemoved?: () => void) => {
      const confirmed = await confirm({
        title: 'Remove this book?',
        message: `“${book.name}” will be removed from the service.`,
        confirmLabel: 'Remove',
      });
      if (!confirmed) return;
      mutation.mutate(book.id, {
        onSuccess: () => {
          toast.success(`“${book.name}” was removed`);
          onRemoved?.();
        },
        onError: (error) => toast.error(error.message),
      });
    },
  };
}
