'use client';

import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { api, ApiError } from '@/lib/api';
import { useMe } from '@/lib/auth';

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
      <main className="container page">
        <p className="muted" role="status">
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
    { href: '/', label: 'Browse' },
    { href: '/my-books', label: 'My books' },
    { href: '/exchanges', label: 'Exchanges' },
    ...(me.role === 'ADMIN' ? [{ href: '/admin/users', label: 'Users' }] : []),
  ];

  return (
    <>
      <header className="nav">
        <div className="container nav__inner">
          <Link href="/" className="nav__brand">
            Book Exchange
          </Link>
          <nav className="nav__links" aria-label="Main">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="nav__link"
                aria-current={pathname === href ? 'page' : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="nav__user">
            <Link href="/profile" className="nav__profile">
              <Avatar url={me.avatarUrl} name={me.name} />
              <span className="nav__who">{me.name}</span>
            </Link>
            {me.role === 'ADMIN' && <span className="badge">Admin</span>}
            <Button variant="secondary" size="sm" onClick={logout}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="container page">{children}</main>
    </>
  );
}
