'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export function ImportCsvForm({ onImport }: { onImport: (file: File) => Promise<void> }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setError('Please choose a CSV file');
    setError('');
    setLoading(true);
    try {
      await onImport(file);
    } catch (err: any) {
      setError(err?.message ?? 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <input
        type="file"
        accept="text/csv,application/vnd.ms-excel,application/csv"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <Button type="submit" loading={loading}>Import CSV</Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
