'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useMyBooksToOffer } from '@/lib/books';
import type { Book } from '@/lib/types';
import { BookRow } from './book-card';
import { Button } from './button';
import {
  DialogBody,
  DialogFoot,
  DialogFrame,
  DialogHead,
  dialogClass,
} from './dialog';
import { RowsSkeleton } from './skeleton';
import { useToast } from './toast';
import { ErrorAlert } from './ui';

/** Lets the Requester pick which of their own Books to offer for a Book. */
export function RequestDialog({
  book,
  onClose,
}: {
  book: Book;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);

  const mine = useMyBooksToOffer();
  const toast = useToast();

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const send = useMutation({
    mutationFn: () =>
      api('/exchange-requests', {
        method: 'POST',
        body: { requestedBookId: book.id, offeredBookIds: selected },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['exchanges'] });
      toast.success(`Request sent to ${book.owner.name}`);
      dialog.current?.close();
    },
  });

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }

  return (
    <dialog
      ref={dialog}
      className={dialogClass}
      aria-labelledby="request-title"
      onClose={onClose}
      onClick={(event) => {
        // A click on the backdrop lands on the dialog element itself.
        if (event.target === dialog.current) dialog.current?.close();
      }}
    >
      {/* Fixed height so the dialog does not resize while the Books load. */}
      <DialogFrame className="h-[min(560px,calc(100dvh-2rem))]">
        <DialogHead>
          <h2 id="request-title">Request “{book.name}”</h2>
          <p className="text-muted">
            Choose the books you offer to {book.owner.name} in return.
          </p>
        </DialogHead>

        <DialogBody>
          {mine.isPending && <RowsSkeleton count={3} rowClassName="h-[78px]" />}
          <ErrorAlert error={mine.error} />
          {mine.data?.items.length === 0 && (
            <p className="text-muted">
              You have no books to offer yet.{' '}
              <Link href="/me/books">Add some first.</Link>
            </p>
          )}
          {mine.data?.items.map((offered) => (
            <label
              key={offered.id}
              className="flex cursor-pointer items-center gap-3 rounded-sm border border-line px-3 py-2 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-focus hover:bg-subtle has-checked:border-accent has-checked:bg-subtle"
            >
              <input
                type="checkbox"
                className="size-[18px] flex-none accent-accent"
                checked={selected.includes(offered.id)}
                onChange={() => toggle(offered.id)}
              />
              <BookRow book={offered} />
            </label>
          ))}
          {mine.data && mine.data.total > mine.data.items.length && (
            <p className="text-muted">
              Showing your first {mine.data.items.length} of {mine.data.total}{' '}
              books.
            </p>
          )}
          <ErrorAlert error={send.error} />
        </DialogBody>

        <DialogFoot>
          <Button variant="secondary" onClick={() => dialog.current?.close()}>
            Cancel
          </Button>
          <Button
            disabled={selected.length === 0}
            loading={send.isPending}
            onClick={() => send.mutate()}
          >
            Send request
          </Button>
        </DialogFoot>
      </DialogFrame>
    </dialog>
  );
}
