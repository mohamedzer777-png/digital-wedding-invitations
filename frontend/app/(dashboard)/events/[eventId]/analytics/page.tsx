'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Users, Send, TrendingUp, Eye, ArrowLeft, BarChart3 } from 'lucide-react';
import { useEvent } from '@/lib/hooks/useEvent';
import { useAnalyticsSummary, useAnalyticsTimeline } from '@/lib/hooks/useAnalytics';
import { apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';

const RSVP_COLORS = {
  going: '#16a34a',
  notGoing: '#dc2626',
  maybe: '#d97706',
  pending: '#94a3b8',
};

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  suffix?: string;
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <Icon size={22} />
      </span>
      <div>
        <p className="text-2xl font-bold text-slate-900">
          {value}
          {suffix && <span className="ml-0.5 text-base font-medium text-slate-400">{suffix}</span>}
        </p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </Card>
  );
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center gap-2 text-center text-slate-400">
      <BarChart3 size={36} />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export default function AnalyticsPage({ params }: { params: { eventId: string } }) {
  const { eventId } = params;
  const router = useRouter();
  const event = useEvent(eventId);
  const summaryQ = useAnalyticsSummary(eventId);
  const timelineQ = useAnalyticsTimeline(eventId, 30);

  // Charts measure the DOM, so only render them after mount (avoids SSR sizing).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const summary = summaryQ.data;
  const timeline = timelineQ.data?.timeline ?? [];

  const rsvpData = summary
    ? [
        { name: 'Going', value: summary.guests.going, color: RSVP_COLORS.going },
        { name: 'Not going', value: summary.guests.notGoing, color: RSVP_COLORS.notGoing },
        { name: 'Maybe', value: summary.guests.maybe, color: RSVP_COLORS.maybe },
        { name: 'Pending', value: summary.guests.pending, color: RSVP_COLORS.pending },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push(`/events/${eventId}`)}
            className="mb-1 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft size={15} /> Back to event
          </button>
          <h1 className="text-2xl font-bold text-slate-900">
            Analytics{event.data?.title ? ` — ${event.data.title}` : ''}
          </h1>
        </div>
        <Button variant="secondary" onClick={() => summaryQ.refetch()}>
          Refresh
        </Button>
      </div>

      {summaryQ.isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : summaryQ.isError ? (
        <Card className="p-6 text-sm text-red-700">{apiErrorMessage(summaryQ.error)}</Card>
      ) : summary ? (
        <>
          {/* Summary cards */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Users} label="Total guests" value={summary.guests.total} />
            <StatCard icon={Send} label="Messages sent" value={summary.messages.sent} />
            <StatCard icon={TrendingUp} label="Response rate" value={summary.engagement.responseRate} suffix="%" />
            <StatCard icon={Eye} label="Open rate" value={summary.engagement.openRate} suffix="%" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* RSVP pie */}
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">RSVP breakdown</h2>
              {!mounted ? (
                <div className="flex h-[280px] items-center justify-center">
                  <Spinner />
                </div>
              ) : rsvpData.length === 0 ? (
                <ChartEmpty message="No guests yet — add guests to see RSVP responses." />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={rsvpData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={64}
                      outerRadius={104}
                      paddingAngle={2}
                    >
                      {rsvpData.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Activity bar chart */}
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Activity (last 30 days)</h2>
              {!mounted ? (
                <div className="flex h-[280px] items-center justify-center">
                  <Spinner />
                </div>
              ) : timeline.length === 0 ? (
                <ChartEmpty message="No activity yet — send invitations to start tracking." />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={timeline} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="messagesSent" name="Messages sent" fill="#ec4884" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="opened" name="Opened" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="rsvpClicked" name="RSVP clicks" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* Message status strip */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Sent', value: summary.messages.sent },
              { label: 'Delivered', value: summary.messages.delivered },
              { label: 'Read', value: summary.messages.read },
              { label: 'Failed', value: summary.messages.failed },
            ].map((m) => (
              <Card key={m.label} className="p-4 text-center">
                <p className="text-xl font-bold text-slate-900">{m.value}</p>
                <p className="text-xs text-slate-500">{m.label}</p>
              </Card>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
