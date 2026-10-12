'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { RequestCard } from '@/components/request-card';
import {
  EmptyState,
  ErrorAlert,
  PageHeader,
  RowsSkeleton,
} from '@/components/ui';
import { api } from '@/lib/api';
import { ME_KEY, PROFILE_KEY, useProfile } from '@/lib/auth';
import type { ExchangeRequest, Profile } from '@/lib/types';

function ProfileForm({ profile }: { profile: Profile }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const emailChanged = email.trim().toLowerCase() !== profile.email;

  const save = useMutation({
    mutationFn: () =>
      api<Profile>('/auth/me', {
        method: 'PATCH',
        body: {
          name,
          email,
          avatarUrl: avatarUrl.trim() || null,
          currentPassword: emailChanged ? currentPassword : undefined,
        },
      }),
    onSuccess: (updated) => {
      setCurrentPassword('');
      queryClient.setQueryData(PROFILE_KEY, updated);
      queryClient.setQueryData(ME_KEY, updated);
    },
  });

  return (
    <form
      className="card form"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      <div className="profile-head">
        <Avatar url={avatarUrl.trim()} name={name || profile.name} size="lg" />
        <p className="muted">Your avatar is shown in the top bar.</p>
      </div>
      <div className="form-grid">
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
        {emailChanged && (
          <label className="field">
            Current password (needed to change your email)
            <input
              className="input"
              type="password"
              required
              maxLength={72}
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </label>
        )}
        <label className="field">
          Avatar URL
          <input
            className="input"
            type="url"
            maxLength={2048}
            placeholder="https://…"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
          />
        </label>
      </div>
      <ErrorAlert error={save.error} />
      {save.isSuccess && (
        <p className="muted" role="status">
          Profile saved.
        </p>
      )}
      <div className="form__actions">
        <Button type="submit" loading={save.isPending}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

function ReceivedRequests() {
  const requests = useQuery({
    queryKey: ['exchanges', 'received'],
    queryFn: () => api<ExchangeRequest[]>('/exchange-requests/received'),
  });

  return (
    <section className="section">
      <div className="section__title">
        <h2>Exchange requests for you</h2>
        {requests.data && <span className="count">{requests.data.length}</span>}
      </div>
      <ErrorAlert error={requests.error} />
      {requests.isPending && <RowsSkeleton />}
      {requests.data?.length === 0 && (
        <EmptyState title="Nothing here yet">
          When someone asks for one of your books, it shows up here.
        </EmptyState>
      )}
      <div className="record-list">
        {requests.data?.map((request) => (
          <RequestCard key={request.id} request={request} kind="received" />
        ))}
      </div>
    </section>
  );
}

export default function ProfilePage() {
  const profile = useProfile();

  return (
    <>
      <PageHeader
        title="Profile"
        subtitle="Your details, your books and the requests you received."
      >
        {profile.data && (
          <span className="count">
            {profile.data.booksCount}{' '}
            {profile.data.booksCount === 1 ? 'book' : 'books'}
          </span>
        )}
      </PageHeader>
      <ErrorAlert error={profile.error} />
      {profile.isPending && <RowsSkeleton count={1} />}
      {profile.data && <ProfileForm profile={profile.data} />}
      <ReceivedRequests />
    </>
  );
}
