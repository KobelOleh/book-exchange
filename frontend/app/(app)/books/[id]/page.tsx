'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { BookCover } from '@/components/book-cover';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { RequestDialog } from '@/components/request-dialog';
import { Skeleton } from '@/components/skeleton';
import { EmptyState, ErrorAlert } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { useMe } from '@/lib/auth';
import { useBook, useRemoveBook } from '@/lib/books';

const detailClass =
  'mt-4 grid gap-6 p-6 max-sm:grid-cols-1 sm:grid-cols-[minmax(0,260px)_minmax(0,1fr)]';

function BookDetailSkeleton() {
  return (
    <Card className={detailClass} role="status" aria-label="Loading book">
      <Skeleton className="aspect-[2/3]" />
      <div className="grid content-start gap-3">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    </Card>
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
        <Card as="article" className={detailClass}>
          <div className="max-w-65 sm:max-w-none">
            <BookCover url={book.data.photoUrl} title={book.data.name} />
          </div>
          <div className="flex min-w-0 flex-col gap-3">
            <h1 className="[overflow-wrap:anywhere]">{book.data.name}</h1>
            <p className="text-lg text-muted">{book.data.author}</p>
            <dl className="grid gap-2">
              <div className="flex gap-3">
                <dt className="w-18 text-muted">Owner</dt>
                <dd>
                  {book.data.ownerId === me?.id ? 'You' : book.data.owner.name}
                </dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-18 text-muted">Added</dt>
                <dd>{new Date(book.data.createdAt).toLocaleDateString()}</dd>
              </div>
            </dl>
            <div className="mt-auto flex flex-wrap gap-2">
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
        </Card>
      )}

      {requesting && book.data && (
        <RequestDialog book={book.data} onClose={() => setRequesting(false)} />
      )}
    </>
  );
}
