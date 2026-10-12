'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { BookCover } from '@/components/book-cover';
import { Button } from '@/components/button';
import { RequestDialog } from '@/components/request-dialog';
import { EmptyState, ErrorAlert } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { useMe } from '@/lib/auth';
import { useBook, useRemoveBook } from '@/lib/books';

function BookDetailSkeleton() {
  return (
    <div className="card detail" role="status" aria-label="Loading book">
      <div className="skeleton detail__cover-skeleton" />
      <div className="detail__text">
        <div className="skeleton skeleton--row" />
        <div className="skeleton skeleton--row" />
      </div>
    </div>
  );
}

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: me } = useMe();
  const book = useBook(id);
  const remove = useRemoveBook();
  const [requesting, setRequesting] = useState(false);

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push('/books');
  }

  const notFound =
    book.error instanceof ApiError &&
    (book.error.status === 404 || book.error.status === 400);

  return (
    <>
      <div>
        <Button variant="secondary" size="sm" onClick={goBack}>
          ← Back
        </Button>
      </div>

      {book.isPending && <BookDetailSkeleton />}
      {notFound && (
        <EmptyState title="Book not found">
          It may have been removed.{' '}
          <Link href="/books">Browse other books.</Link>
        </EmptyState>
      )}
      {!notFound && <ErrorAlert error={book.error} />}

      {book.data && (
        <article className="card detail">
          <div className="detail__cover">
            <BookCover url={book.data.photoUrl} title={book.data.name} />
          </div>
          <div className="detail__text">
            <h1>{book.data.name}</h1>
            <p className="detail__author">{book.data.author}</p>
            <dl className="detail__facts">
              <div>
                <dt>Owner</dt>
                <dd>
                  {book.data.ownerId === me?.id ? 'You' : book.data.owner.name}
                </dd>
              </div>
              <div>
                <dt>Added</dt>
                <dd>{new Date(book.data.createdAt).toLocaleDateString()}</dd>
              </div>
            </dl>
            <div className="detail__actions">
              {book.data.ownerId === me?.id ? (
                <Button variant="secondary" disabled>
                  Your book
                </Button>
              ) : (
                <Button onClick={() => setRequesting(true)}>Request</Button>
              )}
              {me?.role === 'ADMIN' && book.data.ownerId !== me.id && (
                <Button
                  variant="danger"
                  loading={remove.isBusy}
                  onClick={() =>
                    book.data &&
                    remove.confirmAndRemove(book.data, () =>
                      router.replace('/books'),
                    )
                  }
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        </article>
      )}

      {requesting && book.data && (
        <RequestDialog book={book.data} onClose={() => setRequesting(false)} />
      )}
    </>
  );
}
