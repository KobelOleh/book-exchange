'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { FormCard } from '@/components/card';
import {
  Field,
  FormActions,
  FormGrid,
  Input,
  PasswordInput,
} from '@/components/input';
import { RequestList } from '@/components/request-list';
import { RowsSkeleton } from '@/components/skeleton';
import { useToast } from '@/components/toast';
import { Count, ErrorAlert, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import { ME_KEY, PROFILE_KEY, useProfile } from '@/lib/auth';
import type { Profile } from '@/lib/types';

function ProfileForm({ profile }: { profile: Profile }) {
  const queryClient = useQueryClient();
  const toast = useToast();
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
      toast.success('Profile saved');
      queryClient.setQueryData(PROFILE_KEY, updated);
      queryClient.setQueryData(ME_KEY, updated);
    },
  });

  return (
    <FormCard
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      <div className="flex items-center gap-4">
        <Avatar url={avatarUrl.trim()} name={name || profile.name} size="lg" />
        <p className="text-muted">Your avatar is shown in the top bar.</p>
      </div>
      <FormGrid>
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
        <Field label="Email">
          <Input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        {emailChanged && (
          <Field label="Current password (needed to change your email)">
            <PasswordInput
              required
              maxLength={72}
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </Field>
        )}
        <Field label="Avatar URL">
          <Input
            type="url"
            maxLength={2048}
            placeholder="https://…"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
          />
        </Field>
      </FormGrid>
      <ErrorAlert error={save.error} />
      <FormActions>
        <Button type="submit" loading={save.isPending}>
          Save changes
        </Button>
      </FormActions>
    </FormCard>
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
          <Count>
            {profile.data.booksCount}{' '}
            {profile.data.booksCount === 1 ? 'book' : 'books'}
          </Count>
        )}
      </PageHeader>
      <ErrorAlert error={profile.error} />
      {profile.isPending && <RowsSkeleton count={1} />}
      {profile.data && <ProfileForm profile={profile.data} />}
      <RequestList
        title="Exchange requests for you"
        kind="received"
        emptyText="When someone asks for one of your books, it shows up here."
      />
    </>
  );
}
