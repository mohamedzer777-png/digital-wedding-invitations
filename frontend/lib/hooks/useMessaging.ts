'use client';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useSendWhatsAppInvitations(eventId: string | undefined) {
  return useMutation({
    mutationFn: async () => {
      if (!eventId) throw new Error('EventId is required');
      return (await api.post(`/events/${eventId}/messages/send`, {
        type: 'INVITATION',
      })).data;
    },
  });
}
