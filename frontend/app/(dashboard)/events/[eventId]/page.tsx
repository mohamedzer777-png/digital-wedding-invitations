'use client';

import { useRouter } from 'next/navigation';
import { useEvent } from '@/lib/hooks/useEvent';
import { Button } from '@/components/ui/Button';

export default function EventDetailsPage({ params }: { params: { eventId: string } }) {
  const { eventId } = params;
  const { data, isLoading, error } = useEvent(eventId);
  const router = useRouter();

  if (isLoading) return <div>Loading...</div>;
  if (error || !data) return <div>Error loading event</div>;

  const event = data;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{event.title}</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => router.push(`/events/${eventId}/editor`)}>Edit Invitation</Button>
          <Button onClick={() => router.push(`/events/${eventId}/guests`)}>Manage Guests</Button>
          <Button variant="secondary">Preview Invitation</Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="col-span-2 space-y-3">
          <p className="text-slate-700">{event.description ?? 'No description yet'}</p>
          <div className="flex gap-4 text-sm text-slate-600">
            <div>
              <div className="text-xs text-slate-500">Date</div>
              <div>{event.eventDate ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Venue</div>
              <div>{event.venue ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Guests</div>
              <div>{event._count?.guests ?? 0}</div>
            </div>
          </div>
        </div>

        <aside className="space-y-3">
          <div className="rounded-md border p-4">
            <div className="text-xs text-slate-500">Status</div>
            <div className="font-medium">{event.status}</div>
          </div>
          <div className="rounded-md border p-4">
            <div className="text-xs text-slate-500">Actions</div>
            <div className="flex gap-2 pt-2">
              <Button onClick={() => router.push(`/events/${eventId}/guests`)}>Send Message</Button>
              <Button variant="secondary" onClick={() => router.push(`/events/${eventId}/analytics`)}>
                View Analytics
              </Button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
