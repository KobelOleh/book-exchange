import type { ExchangeRequest } from '@/lib/types';
import { BookRow } from './book-card';

export function RequestCard({
  request,
  kind,
}: {
  request: ExchangeRequest;
  kind: 'sent' | 'received';
}) {
  return (
    <article className="card record">
      <div className="record__head">
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
        <time className="record__time" dateTime={request.createdAt}>
          {new Date(request.createdAt).toLocaleString()}
        </time>
      </div>
      <p className="record__label">In return, offered</p>
      <div className="offer-list">
        {request.offeredBooks.map((book) => (
          <BookRow key={book.id} book={book} />
        ))}
      </div>
    </article>
  );
}
