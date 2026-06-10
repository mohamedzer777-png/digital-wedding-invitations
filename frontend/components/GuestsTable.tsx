'use client';

import { useState } from 'react';
import { ImportCsvForm } from './ImportCsvForm';
import { Button } from '@/components/ui/Button';
import type { GuestItem } from '@/lib/hooks/useGuests';

export function GuestsTable({ guests, onImport, onAddGuest }: { guests: GuestItem[]; onImport: (file: File) => Promise<void>; onAddGuest: () => void }) {
  const [query, setQuery] = useState('');
  const filtered = guests.filter((g) => g.name.toLowerCase().includes(query.toLowerCase()) || g.phone.includes(query));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={onAddGuest}>
            Add Guest
          </Button>
          <input placeholder="Search name or phone" value={query} onChange={(e) => setQuery(e.target.value)} className="rounded-md border px-3 py-2" />
          <Button variant="secondary">Export</Button>
        </div>
        <ImportCsvForm onImport={onImport} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="text-left text-sm text-slate-500">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Group</th>
              <th className="px-3 py-2">Party Size</th>
              <th className="px-3 py-2">RSVP</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((g) => (
              <tr key={g.id} className="border-t">
                <td className="px-3 py-2">{g.name}</td>
                <td className="px-3 py-2">{g.phone}</td>
                <td className="px-3 py-2">{g.groupLabel ?? '—'}</td>
                <td className="px-3 py-2">{g.partySize}</td>
                <td className="px-3 py-2">{g.rsvpStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
