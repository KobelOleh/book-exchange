'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/button';
import {
  EmptyState,
  ErrorAlert,
  PageHeader,
  RowsSkeleton,
} from '@/components/ui';
import { api } from '@/lib/api';
import { useMe } from '@/lib/auth';
import type { Role, User } from '@/lib/types';

const EMPTY_FORM = { name: '', email: '', password: '', role: 'USER' as Role };

export default function AdminUsersPage() {
  const { data: me } = useMe();
  const queryClient = useQueryClient();
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
    },
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      api(`/users/${id}`, { method: 'PATCH', body: { role } }),
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/users/${id}`, { method: 'DELETE' }),
    onSuccess: refresh,
  });

  if (me && !isAdmin) {
    return (
      <p className="alert" role="alert">
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

      <form
        className="card form"
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate();
        }}
      >
        <div className="form-grid">
          <label className="field">
            Name
            <input
              className="input"
              type="text"
              required
              maxLength={100}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="field">
            Email
            <input
              className="input"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label className="field">
            Password
            <input
              className="input"
              type="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          <label className="field">
            Role
            <select
              className="input"
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as Role })
              }
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
        </div>
        <ErrorAlert error={create.error} />
        <div className="form__actions">
          <Button type="submit" loading={create.isPending}>
            Create user
          </Button>
        </div>
      </form>

      <section className="section">
        <div className="section__title">
          <h2>All users</h2>
          {users.data && <span className="count">{users.data.length}</span>}
        </div>
        <ErrorAlert error={users.error ?? changeRole.error ?? remove.error} />
        {users.isPending && isAdmin && <RowsSkeleton />}
        {users.data?.length === 0 && <EmptyState title="No users" />}
        {users.data && users.data.length > 0 && (
          <div className="card table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th className="table__actions">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.data.map((user) => {
                  const isSelf = user.id === me?.id;
                  return (
                    <tr key={user.id}>
                      <td data-label="Name">{user.name}</td>
                      <td data-label="Email">{user.email}</td>
                      <td data-label="Role">
                        <select
                          className="input input--sm"
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
                        </select>
                      </td>
                      <td className="table__actions">
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
                          onClick={() => {
                            if (
                              confirm(
                                `Remove ${user.name}? Their books and requests are removed too.`,
                              )
                            ) {
                              remove.mutate(user.id);
                            }
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
          </div>
        )}
      </section>
    </>
  );
}
