'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { EventItem } from '@/lib/types';

export interface GuestItem {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  groupLabel?: string | null;
  partySize: number;
  rsvpStatus: string;
  createdAt: string;
}

export interface CreateGuestInput {
  name: string;
  phone: string;
  email?: string | null;
  groupLabel?: string | null;
  partySize: number;
}

export function useGuests(eventId: string | undefined, page = 1) {
  return useQuery({
    queryKey: ['guests', eventId, page],
    enabled: Boolean(eventId),
    queryFn: async () => (await api.get<{ items: GuestItem[]; total: number }>(`/events/${eventId}/guests`, { params: { page } })).data,
  });
}

export function useImportGuests(eventId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      if (!eventId) throw new Error('EventId is required');
      const fd = new FormData();
      fd.append('file', file);
      return (await api.post(`/events/${eventId}/guests/import`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['guests', eventId] }),
  });
}

export function useCreateGuest(eventId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (guest: CreateGuestInput) => {
      if (!eventId) throw new Error('EventId is required');
      return (await api.post<GuestItem>(`/events/${eventId}/guests`, guest)).data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['guests', eventId] }),
  });
}
