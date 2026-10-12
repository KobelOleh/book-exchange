'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { ME_KEY } from '@/lib/auth';
import type { User } from '@/lib/types';
import { Button } from './button';
import { ErrorAlert } from './ui';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isRegister = mode === 'register';

  const submit = useMutation({
    mutationFn: () =>
      api<User>(`/auth/${mode}`, {
        method: 'POST',
        body: isRegister ? { name, email, password } : { email, password },
      }),
    onSuccess: (user) => {
      queryClient.setQueryData(ME_KEY, user);
      router.replace('/books');
    },
  });

  return (
    <main className="auth">
      <div className="auth__head">
        <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>
        <p className="muted">
          {isRegister
            ? 'List your books and swap them with other readers.'
            : 'Log in to browse books and manage your exchanges.'}
        </p>
      </div>
      <form
        className="card form"
        onSubmit={(event) => {
          event.preventDefault();
          submit.mutate();
        }}
      >
        {isRegister && (
          <label className="field">
            Name
            <input
              className="input"
              type="text"
              required
              maxLength={100}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
        )}
        <label className="field">
          Email
          <input
            className="input"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="field">
          Password
          <input
            className="input"
            type="password"
            required
            minLength={isRegister ? 8 : undefined}
            maxLength={72}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <ErrorAlert error={submit.error} />
        <Button type="submit" loading={submit.isPending}>
          {isRegister ? 'Register' : 'Log in'}
        </Button>
        {!isRegister && (
          <Link href="/forgot-password" className="auth__footer muted">
            Forgot your password?
          </Link>
        )}
      </form>
      <p className="auth__footer muted">
        {isRegister ? 'Already registered? ' : 'No account yet? '}
        <Link href={isRegister ? '/login' : '/register'}>
          {isRegister ? 'Log in' : 'Register'}
        </Link>
      </p>
    </main>
  );
}
