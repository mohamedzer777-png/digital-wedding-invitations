'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import type { CreateGuestInput } from '@/lib/hooks/useGuests';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  phone: z.string().min(5, 'Phone is required').max(30),
  groupLabel: z.string().max(100).optional(),
  partySize: z.coerce.number().int().min(1).max(50).default(1),
});

type FormValues = z.infer<typeof schema>;

export function AddGuestDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: CreateGuestInput) => Promise<unknown>;
}) {
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', groupLabel: '', partySize: 1 },
  });

  if (!open) return null;

  const onSubmit = async (values: FormValues) => {
    setServerError('');
    try {
      await onCreate(values);
      reset();
      onClose();
    } catch (err: any) {
      setServerError(apiErrorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Add guest</h2>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-5" noValidate>
          {serverError && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</div>
          )}
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Guest name" {...register('name')} />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" placeholder="+972 50 123 4567" {...register('phone')} />
            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
          </div>

          <div>
            <Label htmlFor="groupLabel">Group</Label>
            <Input id="groupLabel" placeholder="Family / Friends" {...register('groupLabel')} />
          </div>

          <div>
            <Label htmlFor="partySize">Party size</Label>
            <Input id="partySize" type="number" min={1} {...register('partySize', { valueAsNumber: true })} />
            {errors.partySize && <p className="mt-1 text-xs text-red-600">{errors.partySize.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Add guest
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
