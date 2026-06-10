'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { EventItem } from '@/lib/types';

export function useEvent(eventId: string | undefined) {
  return useQuery({
    queryKey: ['event', eventId],
    enabled: Boolean(eventId),
    queryFn: async () => (await api.get<EventItem>(`/events/${eventId}`)).data,
  });
}
