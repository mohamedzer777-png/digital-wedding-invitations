'use client';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type AiTone = 'Luxury' | 'Simple' | 'Traditional' | 'Modern';

export interface AiGenerateInput {
  eventType?: string;
  tone?: AiTone;
  coupleNames?: string;
  eventDate?: string;
  venue?: string;
  details?: string;
}

export interface AiGenerateResponse {
  text: string;
}

export function useGenerateInvitationText() {
  return useMutation({
    mutationFn: async (input: AiGenerateInput) => {
      return (await api.post<AiGenerateResponse>('/ai/generate-text', input)).data;
    },
  });
}
