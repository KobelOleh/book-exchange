'use client';

import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
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
      <main className="container">
        <p className="muted">{error ? 'Redirecting…' : 'Loading…'}</p>
      </main>
    );
  }

  async function logout() {
    await api('/auth/logout', { method: 'POST' });
    queryClient.clear();
    router.replace('/login');
  }

  const links = [
    { href: '/', label: 'Browse books' },
    { href: '/my-books', label: 'My books' },
    { href: '/exchanges', label: 'Exchanges' },
    ...(me.role === 'ADMIN' ? [{ href: '/admin/users', label: 'Users' }] : []),
  ];

  return (
    <>
      <nav className="nav">
        <div className="container">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? 'page' : undefined}
            >
              {label}
            </Link>
          ))}
          <span className="spacer" />
          <span className="who">
            {me.name}
            {me.role === 'ADMIN' && ' (admin)'}
          </span>
          <button className="secondary" onClick={logout}>
            Log out
          </button>
        </div>
      </nav>
      <main className="container">{children}</main>
    </>
  );
}
