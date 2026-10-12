'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ExchangeRequest } from '@/lib/types';
import { RequestCard } from './request-card';
import { RowsSkeleton } from './skeleton';
import { EmptyState, ErrorAlert, Section } from './ui';

/** The caller's sent or received ExchangeRequests, with loading and empty states. */
export function RequestList({
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
    <Section title={title} count={requests.data?.length}>
      <ErrorAlert error={requests.error} />
      {requests.isPending && <RowsSkeleton />}
      {requests.data?.length === 0 && (
        <EmptyState title="Nothing here yet">{emptyText}</EmptyState>
      )}
      <div className="grid gap-3">
        {requests.data?.map((request) => (
          <RequestCard key={request.id} request={request} kind={kind} />
        ))}
      </div>
    </Section>
  );
}
