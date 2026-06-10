import { type ReactNode } from 'react';
import clsx from 'clsx';

type Tone = 'green' | 'red' | 'amber' | 'slate' | 'brand' | 'indigo';

const TONES: Record<Tone, string> = {
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  slate: 'bg-slate-100 text-slate-600',
  brand: 'bg-brand-100 text-brand-700',
  indigo: 'bg-indigo-100 text-indigo-700',
};

export function Badge({
  tone = 'slate',
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx('inline-block rounded-full px-2 py-0.5 text-[11px] font-medium', TONES[tone], className)}
    >
      {children}
    </span>
  );
}
