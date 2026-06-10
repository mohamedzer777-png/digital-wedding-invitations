'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { useCreateEvent } from '@/lib/hooks/useEvents';
import { apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

const EVENT_TYPES = ['WEDDING', 'ENGAGEMENT', 'BIRTHDAY', 'CORPORATE', 'OTHER'] as const;

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(EVENT_TYPES),
  eventDate: z.string().optional(),
  venue: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function CreateEventDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createEvent = useCreateEvent();
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { type: 'WEDDING' } });

  if (!open) return null;

  const onSubmit = async (values: FormValues) => {
    setServerError('');
    try {
      await createEvent.mutateAsync({
        title: values.title,
        type: values.type,
        eventDate: values.eventDate || undefined,
        venue: values.venue || undefined,
      });
      reset();
      onClose();
    } catch (err) {
      setServerError(apiErrorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">New event</h2>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-5" noValidate>
          {serverError && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</div>
          )}
          <div>
            <Label htmlFor="title">Event title</Label>
            <Input id="title" placeholder="Dana & Avi's Wedding" {...register('title')} />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                {...register('type')}
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0) + t.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="eventDate">Date</Label>
              <Input id="eventDate" type="date" {...register('eventDate')} />
            </div>
          </div>
          <div>
            <Label htmlFor="venue">Venue</Label>
            <Input id="venue" placeholder="Grand Hall" {...register('venue')} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Create event
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
