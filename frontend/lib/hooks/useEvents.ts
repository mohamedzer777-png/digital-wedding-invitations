'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { EventItem } from '@/lib/types';

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get<{ items: EventItem[] }>('/events')).data.items,
  });
}

export interface CreateEventPayload {
  title: string;
  type: string;
  eventDate?: string;
  venue?: string;
  location?: string;
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateEventPayload) =>
      (await api.post<EventItem>('/events', payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });
}
