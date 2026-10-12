'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { Book } from '@/lib/types';

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

  const mine = useQuery({
    queryKey: ['books', { mine: true }],
    queryFn: () => api<Book[]>('/books?mine=true'),
  });

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
      onClose();
    },
  });

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }

  return (
    <dialog ref={dialog} onClose={onClose}>
      <div className="stack">
        <h1>Request “{book.name}”</h1>
        <p className="muted">
          Choose the books you offer to {book.owner.name} in return.
        </p>
        {mine.isPending && <p className="muted">Loading your books…</p>}
        {mine.data?.length === 0 && (
          <p>
            You have no books to offer yet.{' '}
            <Link href="/my-books">Add some first.</Link>
          </p>
        )}
        {mine.data?.map((offered) => (
          <label key={offered.id} className="pick">
            <input
              type="checkbox"
              checked={selected.includes(offered.id)}
              onChange={() => toggle(offered.id)}
            />
            {offered.name} — {offered.author}
          </label>
        ))}
        {send.error && <p className="error">{send.error.message}</p>}
        <div className="row">
          <button
            disabled={selected.length === 0 || send.isPending}
            onClick={() => send.mutate()}
          >
            Send request
          </button>
          <button className="secondary" onClick={() => dialog.current?.close()}>
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  );
}
