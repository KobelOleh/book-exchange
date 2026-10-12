'use client';

import { PageHeader } from '@/components/ui';
import { RequestList } from '@/components/request-list';

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
