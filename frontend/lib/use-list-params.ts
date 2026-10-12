'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

/** The list's page and search term, kept in the URL so Back and shared links keep them. */
export function useListParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(
    1,
    Number.parseInt(searchParams.get('page') ?? '', 10) || 1,
  );
  const search = searchParams.get('search') ?? '';

  const update = useCallback(
    (changes: { page?: number; search?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      const next = { page, search, ...changes };
      if (next.page > 1) params.set('page', String(next.page));
      else params.delete('page');
      if (next.search) params.set('search', next.search);
      else params.delete('search');
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [page, pathname, router, search, searchParams],
  );

  return {
    page,
    search,
    setPage: (next: number) => update({ page: next }),
    /** A new search always starts from the first page. */
    setSearch: (next: string) => update({ search: next, page: 1 }),
  };
}
