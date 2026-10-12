'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/button';
import { Card, FormCard } from '@/components/card';
import { useConfirm } from '@/components/confirm';
import {
  Field,
  FormActions,
  FormGrid,
  Input,
  PasswordInput,
} from '@/components/input';
import { Select } from '@/components/select';
import { RowsSkeleton } from '@/components/skeleton';
import { useToast } from '@/components/toast';
import { EmptyState, ErrorAlert, PageHeader, Section } from '@/components/ui';
import { api } from '@/lib/api';
import { useMe } from '@/lib/auth';
import type { Role, User } from '@/lib/types';

const EMPTY_FORM = { name: '', email: '', password: '', role: 'USER' as Role };

// On phones the table becomes a stack of rows, each cell labelled by its data-label.
const headCell =
  'p-3 text-left text-xs font-normal tracking-wide text-muted uppercase';
const cell =
  'border-b border-line p-3 align-middle group-last:border-b-0 max-sm:flex max-sm:items-center max-sm:justify-between max-sm:gap-3 max-sm:border-0 max-sm:px-0 max-sm:py-1 max-sm:before:text-xs max-sm:before:text-muted max-sm:before:content-[attr(data-label)]';

export default function AdminUsersPage() {
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_FORM);

  const isAdmin = me?.role === 'ADMIN';
  const users = useQuery({
    queryKey: ['users'],
    queryFn: () => api<User[]>('/users'),
    enabled: isAdmin,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['users'] });

  const create = useMutation({
    mutationFn: () => api<User>('/users', { method: 'POST', body: form }),
    onSuccess: async () => {
      setForm(EMPTY_FORM);
      await refresh();
      toast.success('User created');
    },
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      api(`/users/${id}`, { method: 'PATCH', body: { role } }),
    onSuccess: async (_, { role }) => {
      await refresh();
      toast.success(`Role changed to ${role === 'ADMIN' ? 'Admin' : 'User'}`);
    },
    onError: (error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/users/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await refresh();
      toast.success('User removed');
    },
    onError: (error) => toast.error(error.message),
  });

  if (me && !isAdmin) {
    return (
      <p
        className="rounded-sm bg-danger-soft p-3 text-sm text-danger"
        role="alert"
      >
        Only admins can manage users.
      </p>
    );
  }

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Create accounts, change roles and remove users."
      />

      <FormCard
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate();
        }}
      >
        <FormGrid>
          <Field label="Name">
            <Input
              type="text"
              required
              maxLength={100}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Password">
            <PasswordInput
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
          <Field label="Role">
            <Select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as Role })
              }
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </Field>
        </FormGrid>
        <ErrorAlert error={create.error} />
        <FormActions>
          <Button type="submit" loading={create.isPending}>
            Create user
          </Button>
        </FormActions>
      </FormCard>

      <Section title="All users" count={users.data?.length}>
        <ErrorAlert error={users.error} />
        {users.isPending && isAdmin && <RowsSkeleton />}
        {users.data?.length === 0 && <EmptyState title="No users" />}
        {users.data && users.data.length > 0 && (
          <Card className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="max-sm:hidden">
                <tr>
                  <th className={headCell}>Name</th>
                  <th className={headCell}>Email</th>
                  <th className={headCell}>Role</th>
                  <th className={`${headCell} w-px`}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.data.map((user) => {
                  const isSelf = user.id === me?.id;
                  return (
                    <tr
                      key={user.id}
                      className="group max-sm:grid max-sm:gap-1 max-sm:border-b max-sm:border-line max-sm:px-3 max-sm:py-3 max-sm:last:border-b-0"
                    >
                      <td className={cell} data-label="Name">
                        {user.name}
                      </td>
                      <td className={cell} data-label="Email">
                        {user.email}
                      </td>
                      <td className={cell} data-label="Role">
                        <Select
                          compact
                          aria-label={`Role of ${user.name}`}
                          value={user.role}
                          disabled={isSelf || changeRole.isPending}
                          onChange={(e) =>
                            changeRole.mutate({
                              id: user.id,
                              role: e.target.value as Role,
                            })
                          }
                        >
                          <option value="USER">User</option>
                          <option value="ADMIN">Admin</option>
                        </Select>
                      </td>
                      <td
                        className={`${cell} w-px whitespace-nowrap sm:text-right`}
                      >
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={isSelf}
                          loading={
                            remove.isPending && remove.variables === user.id
                          }
                          title={
                            isSelf ? 'You cannot remove yourself' : undefined
                          }
                          onClick={async () => {
                            const confirmed = await confirm({
                              title: `Remove ${user.name}?`,
                              message:
                                'Their books and requests are removed too.',
                              confirmLabel: 'Remove',
                            });
                            if (confirmed) remove.mutate(user.id);
                          }}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </Section>
    </>
  );
}
