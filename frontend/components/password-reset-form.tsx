'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { AuthShell, authFooterClass } from './auth-shell';
import { Button } from './button';
import { FormCard } from './card';
import { Field, Input } from './input';
import { ErrorAlert } from './ui';

/** Asks for the email a Password Reset Link should be sent to. */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const send = useMutation({
    mutationFn: () =>
      api('/auth/forgot-password', { method: 'POST', body: { email } }),
  });

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we will send you a link to choose a new one."
    >
      {send.isSuccess ? (
        <FormCard as="div" role="status">
          <p>
            If {email} is registered, a reset link is on its way. It works once
            and expires in an hour.
          </p>
        </FormCard>
      ) : (
        <FormCard
          onSubmit={(event) => {
            event.preventDefault();
            send.mutate();
          }}
        >
          <Field label="Email">
            <Input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <ErrorAlert error={send.error} />
          <Button type="submit" className="w-full" loading={send.isPending}>
            Send reset link
          </Button>
        </FormCard>
      )}
      <p className={authFooterClass}>
        <Link href="/login">Back to log in</Link>
      </p>
    </AuthShell>
  );
}

/** Lets the User choose a new password using the link's token. */
export function ResetPasswordForm() {
  const token = useSearchParams().get('token');
  const [password, setPassword] = useState('');
  const reset = useMutation({
    mutationFn: () =>
      api('/auth/reset-password', {
        method: 'POST',
        body: { token, password },
      }),
  });

  return (
    <AuthShell title="Choose a new password">
      {reset.isSuccess ? (
        <FormCard as="div" role="status">
          <p>
            Your password was changed. <Link href="/login">Log in</Link> with
            the new one.
          </p>
        </FormCard>
      ) : !token ? (
        <p
          className="rounded-sm bg-danger-soft p-3 text-sm text-danger"
          role="alert"
        >
          This reset link is incomplete.{' '}
          <Link href="/forgot-password">Request a new one.</Link>
        </p>
      ) : (
        <FormCard
          onSubmit={(event) => {
            event.preventDefault();
            reset.mutate();
          }}
        >
          <Field label="New password">
            <Input
              type="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <ErrorAlert error={reset.error} />
          <Button type="submit" className="w-full" loading={reset.isPending}>
            Change password
          </Button>
        </FormCard>
      )}
    </AuthShell>
  );
}
