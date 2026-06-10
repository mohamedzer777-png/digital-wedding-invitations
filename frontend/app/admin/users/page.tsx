'use client';

import { useState } from 'react';
import { ShieldCheck, ShieldOff, UserX, UserCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useAdminUsers, useUpdateUser } from '@/lib/hooks/useAdmin';
import { apiErrorMessage } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { AdminUser } from '@/lib/types';

const PAGE_SIZE = 20;

function fmtDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const selectClass =
  'rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100';

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const filters = {
    page,
    pageSize: PAGE_SIZE,
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
  };
  const { data, isLoading, isError, error } = useAdminUsers(filters);
  const updateUser = useUpdateUser();
  const [actionError, setActionError] = useState('');

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  const onFilterChange = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const mutate = async (id: string, payload: { role?: string; status?: string }) => {
    setActionError('');
    try {
      await updateUser.mutateAsync({ id, data: payload });
    } catch (err) {
      setActionError(apiErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <p className="mt-1 text-sm text-slate-500">Manage roles, account status, and view plans.</p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select className={selectClass} value={role} onChange={(e) => onFilterChange(setRole)(e.target.value)}>
          <option value="">All roles</option>
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select className={selectClass} value={status} onChange={(e) => onFilterChange(setStatus)(e.target.value)}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        {data && <span className="text-sm text-slate-400">{data.total} user(s)</span>}
      </div>

      {actionError && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : isError ? (
        <Card className="p-6 text-sm text-red-700">{apiErrorMessage(error)}</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.items ?? []).map((u: AdminUser) => {
                  const isSelf = u.id === me?.id;
                  const busy = updateUser.isPending;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{u.name}</div>
                        <div className="text-xs text-slate-400">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={u.role === 'ADMIN' ? 'indigo' : 'slate'}>{u.role}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={u.status === 'ACTIVE' ? 'green' : 'red'}>{u.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{u.subscription?.plan?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{fmtDate(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {isSelf ? (
                            <span className="text-xs italic text-slate-400">You</span>
                          ) : (
                            <>
                              {u.role === 'ADMIN' ? (
                                <Button
                                  variant="ghost"
                                  className="px-2 py-1 text-xs"
                                  disabled={busy}
                                  onClick={() => mutate(u.id, { role: 'USER' })}
                                >
                                  <ShieldOff size={14} /> Demote
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  className="px-2 py-1 text-xs"
                                  disabled={busy}
                                  onClick={() => mutate(u.id, { role: 'ADMIN' })}
                                >
                                  <ShieldCheck size={14} /> Make admin
                                </Button>
                              )}
                              {u.status === 'ACTIVE' ? (
                                <Button
                                  variant="ghost"
                                  className="px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                                  disabled={busy}
                                  onClick={() => mutate(u.id, { status: 'SUSPENDED' })}
                                >
                                  <UserX size={14} /> Suspend
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  className="px-2 py-1 text-xs text-green-700 hover:bg-green-50"
                                  disabled={busy}
                                  onClick={() => mutate(u.id, { status: 'ACTIVE' })}
                                >
                                  <UserCheck size={14} /> Activate
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {(data?.items.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                      No users match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <span className="text-sm text-slate-500">
              Page {data?.page ?? 1} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" className="px-3 py-1.5 text-xs" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button
                variant="secondary"
                className="px-3 py-1.5 text-xs"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
