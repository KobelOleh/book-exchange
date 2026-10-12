'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from './button';
import { ErrorAlert } from './ui';

/** Asks for the email a Password Reset Link should be sent to. */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const send = useMutation({
    mutationFn: () =>
      api('/auth/forgot-password', { method: 'POST', body: { email } }),
  });

  return (
    <main className="auth">
      <div className="auth__head">
        <h1>Forgot your password?</h1>
        <p className="muted">
          Enter your email and we will send you a link to choose a new one.
        </p>
      </div>
      {send.isSuccess ? (
        <p className="card form" role="status">
          If {email} is registered, a reset link is on its way. It works once
          and expires in an hour.
        </p>
      ) : (
        <form
          className="card form"
          onSubmit={(event) => {
            event.preventDefault();
            send.mutate();
          }}
        >
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
          <ErrorAlert error={send.error} />
          <Button type="submit" loading={send.isPending}>
            Send reset link
          </Button>
        </form>
      )}
      <p className="auth__footer muted">
        <Link href="/login">Back to log in</Link>
      </p>
    </main>
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
    <main className="auth">
      <div className="auth__head">
        <h1>Choose a new password</h1>
      </div>
      {reset.isSuccess ? (
        <p className="card form" role="status">
          Your password was changed. <Link href="/login">Log in</Link> with the
          new one.
        </p>
      ) : !token ? (
        <p className="alert" role="alert">
          This reset link is incomplete.{' '}
          <Link href="/forgot-password">Request a new one.</Link>
        </p>
      ) : (
        <form
          className="card form"
          onSubmit={(event) => {
            event.preventDefault();
            reset.mutate();
          }}
        >
          <label className="field">
            New password
            <input
              className="input"
              type="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <ErrorAlert error={reset.error} />
          <Button type="submit" loading={reset.isPending}>
            Change password
          </Button>
        </form>
      )}
    </main>
  );
}
