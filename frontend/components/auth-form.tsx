'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { ME_KEY } from '@/lib/auth';
import type { User } from '@/lib/types';
import { AuthShell, authFooterClass } from './auth-shell';
import { Button } from './button';
import { FormCard } from './card';
import { Field, Input, PasswordInput } from './input';
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
    <AuthShell
      title={isRegister ? 'Create your account' : 'Welcome back'}
      subtitle={
        isRegister
          ? 'List your books and swap them with other readers.'
          : 'Log in to browse books and manage your exchanges.'
      }
    >
      <FormCard
        onSubmit={(event) => {
          event.preventDefault();
          submit.mutate();
        }}
      >
        {isRegister && (
          <Field label="Name">
            <Input
              type="text"
              required
              maxLength={100}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
        )}
        <Field label="Email">
          <Input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password">
          <PasswordInput
            required
            minLength={isRegister ? 8 : undefined}
            maxLength={72}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <ErrorAlert error={submit.error} />
        <Button type="submit" className="w-full" loading={submit.isPending}>
          {isRegister ? 'Register' : 'Log in'}
        </Button>
        {!isRegister && (
          <Link href="/forgot-password" className={authFooterClass}>
            Forgot your password?
          </Link>
        )}
      </FormCard>
      <p className={authFooterClass}>
        {isRegister ? 'Already registered? ' : 'No account yet? '}
        <Link href={isRegister ? '/login' : '/register'}>
          {isRegister ? 'Log in' : 'Register'}
        </Link>
      </p>
    </AuthShell>
  );
}
