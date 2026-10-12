'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { ME_KEY } from '@/lib/auth';
import type { User } from '@/lib/types';

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
      router.replace('/');
    },
  });

  return (
    <main className="auth">
      <h1>{isRegister ? 'Create account' : 'Log in'}</h1>
      <form
        className="card stack"
        onSubmit={(event) => {
          event.preventDefault();
          submit.mutate();
        }}
      >
        {isRegister && (
          <label>
            Name
            <input
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
        )}
        <label>
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            minLength={isRegister ? 8 : undefined}
            maxLength={72}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {submit.error && <p className="error">{submit.error.message}</p>}
        <button type="submit" disabled={submit.isPending}>
          {isRegister ? 'Register' : 'Log in'}
        </button>
      </form>
      <p className="muted">
        {isRegister ? 'Already registered? ' : 'No account yet? '}
        <Link href={isRegister ? '/login' : '/register'}>
          {isRegister ? 'Log in' : 'Register'}
        </Link>
      </p>
    </main>
  );
}
