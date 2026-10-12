'use client';

import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { api, ApiError } from '@/lib/api';
import { useMe } from '@/lib/auth';

const pageClass =
  'mx-auto grid w-full max-w-page content-start gap-6 px-4 pt-6 pb-12';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { data: me, error } = useMe();

  useEffect(() => {
    if (error instanceof ApiError && error.status === 401) {
      router.replace('/login');
    }
  }, [error, router]);

  if (!me) {
    return (
      <main className={pageClass}>
        <p className="text-muted" role="status">
          {error ? 'Redirecting…' : 'Loading…'}
        </p>
      </main>
    );
  }

  async function logout() {
    await api('/auth/logout', { method: 'POST' });
    queryClient.clear();
    router.replace('/login');
  }

  const links = [
    { href: '/books', label: 'Browse' },
    { href: '/me/books', label: 'My books' },
    { href: '/exchanges', label: 'Exchanges' },
    ...(me.role === 'ADMIN' ? [{ href: '/admin', label: 'Users' }] : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-line bg-surface">
        <div className="mx-auto grid min-h-14 w-full max-w-page grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 px-4 py-2 sm:grid-cols-[auto_1fr_auto] sm:py-0">
          <Link href="/books" className="font-bold text-ink no-underline">
            Book Exchange
          </Link>
          <nav
            className="col-span-full row-start-2 flex gap-1 overflow-x-auto [scrollbar-width:none] sm:col-auto sm:row-start-auto"
            aria-label="Main"
          >
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex h-8 items-center rounded-sm px-3 text-sm whitespace-nowrap text-muted no-underline hover:bg-subtle hover:text-ink aria-[current=page]:bg-subtle aria-[current=page]:font-semibold aria-[current=page]:text-ink"
                aria-current={
                  pathname === href || pathname.startsWith(`${href}/`)
                    ? 'page'
                    : undefined
                }
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 text-inherit no-underline"
            >
              <Avatar url={me.avatarUrl} name={me.name} />
              <span className="hidden sm:inline">{me.name}</span>
            </Link>
            {me.role === 'ADMIN' && (
              <span className="inline-flex h-5 items-center rounded-full bg-subtle px-2 text-xs font-semibold text-muted">
                Admin
              </span>
            )}
            <Button variant="secondary" size="sm" onClick={logout}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className={pageClass}>{children}</main>
    </>
  );
}
