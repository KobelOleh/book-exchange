'use client';

import { useQuery } from '@tanstack/react-query';
import { BookRow } from '@/components/book-card';
import {
  EmptyState,
  ErrorAlert,
  PageHeader,
  RowsSkeleton,
} from '@/components/ui';
import { api } from '@/lib/api';
import type { ExchangeRequest } from '@/lib/types';

function RequestCard({
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

function RequestList({
  title,
  kind,
  emptyText,
}: {
  title: string;
  kind: 'sent' | 'received';
  emptyText: string;
}) {
  const requests = useQuery({
    queryKey: ['exchanges', kind],
    queryFn: () => api<ExchangeRequest[]>(`/exchange-requests/${kind}`),
  });

  return (
    <section className="section">
      <div className="section__title">
        <h2>{title}</h2>
        {requests.data && <span className="count">{requests.data.length}</span>}
      </div>
      <ErrorAlert error={requests.error} />
      {requests.isPending && <RowsSkeleton />}
      {requests.data?.length === 0 && (
        <EmptyState title="Nothing here yet">{emptyText}</EmptyState>
      )}
      <div className="record-list">
        {requests.data?.map((request) => (
          <RequestCard key={request.id} request={request} kind={kind} />
        ))}
      </div>
    </section>
  );
}

export default function ExchangesPage() {
  return (
    <>
      <PageHeader
        title="Exchanges"
        subtitle="Requests people sent you and requests you sent."
      />
      <RequestList
        title="Received"
        kind="received"
        emptyText="When someone asks for one of your books, it shows up here."
      />
      <RequestList
        title="Sent"
        kind="sent"
        emptyText="Request a book from the Browse page to start an exchange."
      />
    </>
  );
}
