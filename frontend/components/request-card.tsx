import type { ExchangeRequest } from '@/lib/types';
import { BookRow } from './book-card';
import { Card } from './card';

export function RequestCard({
  request,
  kind,
}: {
  request: ExchangeRequest;
  kind: 'sent' | 'received';
}) {
  return (
    <Card as="article" className="grid gap-3 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p>
          {kind === 'sent' ? (
            <>
              You asked <strong>{request.requestedBook.owner.name}</strong> for
              “{request.requestedBook.name}”
            </>
          ) : (
            <>
              <strong>{request.requester.name}</strong> (
              {request.requester.email}) wants your “
              {request.requestedBook.name}”
            </>
          )}
        </p>
        <time className="text-xs text-muted" dateTime={request.createdAt}>
          {new Date(request.createdAt).toLocaleString()}
        </time>
      </div>
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">
        In return, offered
      </p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
        {request.offeredBooks.map((book) => (
          <BookRow key={book.id} book={book} />
        ))}
      </div>
    </Card>
  );
}
