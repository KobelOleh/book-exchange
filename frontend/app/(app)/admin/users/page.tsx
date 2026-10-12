'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useMe } from '@/lib/auth';
import type { Role, User } from '@/lib/types';

export default function AdminUsersPage() {
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER' as Role,
  });

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
      setForm({ name: '', email: '', password: '', role: 'USER' });
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
    return <p className="error">Only admins can manage users.</p>;
  }

  return (
    <>
      <h1>Users</h1>
      <form
        className="card stack"
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate();
        }}
      >
        <div className="row">
          <label>
            Name
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          <label>
            Role
            <select
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
        {create.error && <p className="error">{create.error.message}</p>}
        <div>
          <button type="submit" disabled={create.isPending}>
            Create user
          </button>
        </div>
      </form>

      {users.isPending && isAdmin && <p className="muted">Loading…</p>}
      {users.error && <p className="error">{users.error.message}</p>}
      {changeRole.error && <p className="error">{changeRole.error.message}</p>}
      {remove.error && <p className="error">{remove.error.message}</p>}
      <table style={{ marginTop: 24 }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {users.data?.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>
                <select
                  aria-label={`Role of ${user.name}`}
                  value={user.role}
                  disabled={user.id === me?.id}
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
              <td>
                {user.id !== me?.id && (
                  <button
                    className="danger"
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
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
