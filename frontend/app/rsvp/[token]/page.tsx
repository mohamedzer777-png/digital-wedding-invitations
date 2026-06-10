'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { apiErrorMessage } from '@/lib/api';
import type { InvitationDesign, RsvpPageData } from '@/lib/types';
import { RsvpBlockRenderer } from '@/components/RsvpBlockRenderer';
import { Button } from '@/components/ui/Button';

const RSVP_OPTIONS = [
  { value: 'GOING', label: 'Going' },
  { value: 'MAYBE', label: 'Maybe' },
  { value: 'NOT_GOING', label: 'Not going' },
] as const;

export default function RsvpPage({ params }: { params: { token: string } }) {
  const { token } = params;
  const [data, setData] = useState<RsvpPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'GOING' | 'MAYBE' | 'NOT_GOING'>('GOING');
  const [partySize, setPartySize] = useState(1);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<RsvpPageData>(`/rsvp/${token}`);
        setData(res.data);
        const currentStatus = res.data.guest.rsvpStatus ?? 'GOING';
        setStatus(currentStatus === 'PENDING' ? 'GOING' : (currentStatus as typeof status));
        setPartySize(res.data.guest.partySize ?? 1);
      } catch (err) {
        setFeedback({ type: 'error', msg: apiErrorMessage(err) });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  useEffect(() => {
    if (!feedback) return undefined;
    const timer = window.setTimeout(() => setFeedback(null), 4000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      await api.post(`/rsvp/${token}/respond`, { status, partySize });
      setFeedback({ type: 'success', msg: 'תודה! ההמשתתפות נשמרה בהצלחה.' });
    } catch (err) {
      setFeedback({ type: 'error', msg: apiErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold text-slate-900">RSVP</h1>
          <p className="mt-2 text-sm text-slate-600">
            Please review the invitation and send your response below.
          </p>
        </div>

        {feedback && (
          <div className={`rounded-xl p-4 text-sm ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {feedback.msg}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-500">Loading invitation...</div>
        ) : data ? (
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
            <section className="space-y-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.16em] text-slate-500">{data.event.type}</p>
                <h2 className="text-2xl font-semibold text-slate-900">{data.event.title}</h2>
                <div className="text-sm text-slate-600">
                  <p>{data.event.eventDate ?? 'Date not set'}</p>
                  <p>{data.event.venue ?? 'Venue not set'}</p>
                  <p>{data.event.location ?? ''}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <RsvpBlockRenderer design={data.invitation?.design ?? { blocks: [] }} />
              </div>
            </section>

            <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6">
              <div>
                <p className="text-sm font-medium text-slate-700">Hello, {data.guest.name}</p>
                <p className="mt-1 text-sm text-slate-500">Please submit your RSVP below.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">RSVP status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as typeof status)}
                    className="w-full rounded-2xl border border-slate-300 bg-white p-3 text-sm text-slate-900"
                  >
                    {RSVP_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Number of guests</label>
                  <input
                    type="number"
                    min={1}
                    value={partySize}
                    onChange={(e) => setPartySize(Number(e.target.value))}
                    className="w-full rounded-2xl border border-slate-300 bg-white p-3 text-sm text-slate-900"
                  />
                </div>

                <Button type="submit" loading={submitting} disabled={submitting} className="w-full">
                  Send RSVP
                </Button>

                {data.guest.respondedAt && (
                  <p className="text-sm text-slate-500">You previously responded on {new Date(data.guest.respondedAt).toLocaleDateString()}.</p>
                )}
              </form>
            </aside>
          </div>
        ) : (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center text-rose-700">
            Unable to load RSVP details. Please check your link and try again.
          </div>
        )}
      </div>
    </div>
  );
}
