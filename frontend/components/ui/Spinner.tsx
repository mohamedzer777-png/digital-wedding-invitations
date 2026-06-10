import clsx from 'clsx';

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        'inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600',
        className,
      )}
    />
  );
}
