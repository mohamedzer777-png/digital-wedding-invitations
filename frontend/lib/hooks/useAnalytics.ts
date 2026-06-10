'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AnalyticsSummary, AnalyticsTimeline } from '@/lib/types';

export function useAnalyticsSummary(eventId: string) {
  return useQuery({
    queryKey: ['analytics', eventId, 'summary'],
    queryFn: async () => (await api.get<AnalyticsSummary>(`/events/${eventId}/analytics/summary`)).data,
    enabled: !!eventId,
  });
}

export function useAnalyticsTimeline(eventId: string, days = 30) {
  return useQuery({
    queryKey: ['analytics', eventId, 'timeline', days],
    queryFn: async () =>
      (await api.get<AnalyticsTimeline>(`/events/${eventId}/analytics/timeline`, { params: { days } })).data,
    enabled: !!eventId,
  });
}
