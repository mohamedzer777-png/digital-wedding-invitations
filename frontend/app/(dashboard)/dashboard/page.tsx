'use client';

import { useMemo, useState } from 'react';
import { CalendarHeart, Users, Plus, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';
import { useAuth } from '@/lib/auth-context';
import { useEvents } from '@/lib/hooks/useEvents';
import { apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { CreateEventDialog } from '@/components/CreateEventDialog';
import type { EventItem } from '@/lib/types';

function fmtDate(value: string | null) {
  if (!value) return 'No date set';
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  PUBLISHED: 'bg-green-100 text-green-700',
  ARCHIVED: 'bg-amber-100 text-amber-700',
};

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <Icon size={22} />
      </span>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </Card>
  );
}

function EventCard({ event }: { event: EventItem }) {
  return (
    <Link href={`/events/${event.id}`} className="block">
      <Card className="flex flex-col gap-3 p-5 transition hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900">{event.title}</h3>
          <span className={clsx('rounded-full px-2 py-0.5 text-[11px] font-medium', STATUS_STYLES[event.status] ?? 'bg-slate-100 text-slate-600')}>
            {event.status}
          </span>
        </div>
        <div className="space-y-1.5 text-sm text-slate-500">
          <p className="flex items-center gap-2">
            <Clock size={15} /> {fmtDate(event.eventDate)}
          </p>
          <p className="flex items-center gap-2">
            <MapPin size={15} /> {event.venue || '—'}
          </p>
          <p className="flex items-center gap-2">
            <Users size={15} /> {event._count?.guests ?? 0} guests
          </p>
        </div>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: events, isLoading, isError, error } = useEvents();
  const [dialogOpen, setDialogOpen] = useState(false);

  const stats = useMemo(() => {
    const list = events ?? [];
    const now = Date.now();
    return {
      events: list.length,
      guests: list.reduce((sum, e) => sum + (e._count?.guests ?? 0), 0),
      upcoming: list.filter((e) => e.eventDate && new Date(e.eventDate).getTime() > now).length,
    };
  }, [events]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">Here&apos;s an overview of your events.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus size={18} /> New event
        </Button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={CalendarHeart} label="Events" value={stats.events} />
        <StatCard icon={Users} label="Total guests" value={stats.guests} />
        <StatCard icon={Clock} label="Upcoming" value={stats.upcoming} />
      </div>

      <h2 className="mb-4 text-lg font-semibold text-slate-900">Your events</h2>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : isError ? (
        <Card className="p-6 text-sm text-red-700">{apiErrorMessage(error)}</Card>
      ) : (events?.length ?? 0) === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <CalendarHeart className="text-brand-300" size={40} />
          <p className="text-slate-500">No events yet. Create your first one to get started.</p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus size={18} /> New event
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events!.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      <CreateEventDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
