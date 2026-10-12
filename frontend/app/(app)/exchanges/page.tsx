'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ExchangeRequest } from '@/lib/types';

function RequestList({
  title,
  kind,
}: {
  title: string;
  kind: 'sent' | 'received';
}) {
  const requests = useQuery({
    queryKey: ['exchanges', kind],
    queryFn: () => api<ExchangeRequest[]>(`/exchange-requests/${kind}`),
  });

  return (
    <section>
      <h2>{title}</h2>
      {requests.isPending && <p className="muted">Loading…</p>}
      {requests.error && <p className="error">{requests.error.message}</p>}
      {requests.data?.length === 0 && <p className="muted">Nothing yet.</p>}
      <div className="stack">
        {requests.data?.map((request) => (
          <article key={request.id} className="card stack">
            <div>
              {kind === 'sent' ? (
                <>
                  You asked <strong>{request.requestedBook.owner.name}</strong>{' '}
                  for <strong>“{request.requestedBook.name}”</strong>
                </>
              ) : (
                <>
                  <strong>{request.requester.name}</strong> (
                  {request.requester.email}) wants your{' '}
                  <strong>“{request.requestedBook.name}”</strong>
                </>
              )}
              <div className="muted">
                {new Date(request.createdAt).toLocaleString()}
              </div>
            </div>
            <div>
              <span className="muted">In return, offered: </span>
              <span className="chips" style={{ display: 'inline-flex' }}>
                {request.offeredBooks.map((book) => (
                  <span key={book.id} className="chip">
                    {book.name} — {book.author}
                  </span>
                ))}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function ExchangesPage() {
  return (
    <>
      <h1>Exchanges</h1>
      <RequestList title="Received" kind="received" />
      <RequestList title="Sent" kind="sent" />
    </>
  );
}
