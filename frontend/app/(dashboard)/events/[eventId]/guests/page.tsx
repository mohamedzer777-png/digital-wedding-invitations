'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGuests, useImportGuests, useCreateGuest, type CreateGuestInput } from '@/lib/hooks/useGuests';
import { useSendWhatsAppInvitations } from '@/lib/hooks/useMessaging';
import { apiErrorMessage } from '@/lib/api';
import { GuestsTable } from '@/components/GuestsTable';
import { AddGuestDialog } from '@/components/AddGuestDialog';
import { Button } from '@/components/ui/Button';

export default function GuestsPage({ params }: { params: { eventId: string } }) {
  const { eventId } = params;
  const { data, isLoading } = useGuests(eventId);
  const importMut = useImportGuests(eventId);
  const createGuest = useCreateGuest(eventId);
  const sendWhatsApp = useSendWhatsAppInvitations(eventId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const router = useRouter();

  if (isLoading) return <div>Loading...</div>;

  const guests = data?.items ?? [];

  const handleSendWhatsApp = async () => {
    try {
      await sendWhatsApp.mutateAsync();
      setFeedback({ type: 'success', msg: 'WhatsApp invitations sent successfully.' });
    } catch (err: any) {
      setFeedback({ type: 'error', msg: apiErrorMessage(err) });
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-medium">Guests</h2>
          {feedback && (
            <p className={`mt-1 text-sm ${feedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {feedback.msg}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => router.push(`/events/${eventId}`)}
          >
            Back to event
          </Button>
          <Button
            onClick={handleSendWhatsApp}
            loading={sendWhatsApp.isPending}
            disabled={sendWhatsApp.isPending || guests.length === 0}
          >
            Send WhatsApp Invitations
          </Button>
        </div>
      </header>

      <GuestsTable
        guests={guests}
        onImport={(file) => importMut.mutateAsync(file)}
        onAddGuest={() => setDialogOpen(true)}
      />

      {importMut.status === 'pending' && <div>Importing...</div>}

      <AddGuestDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreate={(values: CreateGuestInput) => createGuest.mutateAsync(values)}
      />
    </div>
  );
}
