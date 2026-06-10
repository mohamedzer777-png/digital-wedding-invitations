'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AdminPlan, AdminUser, AdminUsersResponse, SystemAnalytics } from '@/lib/types';

export function useSystemAnalytics() {
  return useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: async () => (await api.get<SystemAnalytics>('/admin/analytics')).data,
  });
}

export interface AdminUserFilters {
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export function useAdminUsers(filters: AdminUserFilters = {}) {
  return useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: async () => (await api.get<AdminUsersResponse>('/admin/users', { params: filters })).data,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { role?: string; status?: string } }) =>
      (await api.patch<AdminUser>(`/admin/users/${id}`, data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useAdminPlans() {
  return useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: async () => (await api.get<{ items: AdminPlan[] }>('/admin/plans')).data.items,
  });
}
