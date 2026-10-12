'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useMyBooksToOffer } from '@/lib/books';
import type { Book } from '@/lib/types';
import { BookRow } from './book-card';
import { Button } from './button';
import { useToast } from './toast';
import { ErrorAlert, RowsSkeleton } from './ui';

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
      className="dialog dialog--request"
      aria-labelledby="request-title"
      onClose={onClose}
      onClick={(event) => {
        // A click on the backdrop lands on the dialog element itself.
        if (event.target === dialog.current) dialog.current?.close();
      }}
    >
      <div className="dialog__inner">
        <div className="dialog__head">
          <h2 id="request-title">Request “{book.name}”</h2>
          <p className="muted">
            Choose the books you offer to {book.owner.name} in return.
          </p>
        </div>

        <div className="dialog__body">
          {mine.isPending && <RowsSkeleton count={3} />}
          <ErrorAlert error={mine.error} />
          {mine.data?.items.length === 0 && (
            <p className="muted">
              You have no books to offer yet.{' '}
              <Link href="/my-books">Add some first.</Link>
            </p>
          )}
          {mine.data?.items.map((offered) => (
            <label key={offered.id} className="pick">
              <input
                type="checkbox"
                checked={selected.includes(offered.id)}
                onChange={() => toggle(offered.id)}
              />
              <BookRow book={offered} />
            </label>
          ))}
          {mine.data && mine.data.total > mine.data.items.length && (
            <p className="muted">
              Showing your first {mine.data.items.length} of {mine.data.total}{' '}
              books.
            </p>
          )}
          <ErrorAlert error={send.error} />
        </div>

        <div className="dialog__foot">
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
        </div>
      </div>
    </dialog>
  );
}
