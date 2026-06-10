'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Spinner } from '@/components/ui/Spinner';

// Events/Guests/Builder screens land in later Phase 3 steps.
const NAV = [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-6 py-5">
          <span className="font-serif text-2xl font-bold text-brand-700">InviteFlow</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
          {user.role === 'ADMIN' && (
            <Link
              href="/admin"
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                pathname.startsWith('/admin')
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              <ShieldCheck size={18} />
              Admin
            </Link>
          )}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 px-2">
            <p className="truncate text-sm font-medium text-slate-800">{user.name}</p>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
            {user.subscription?.plan?.name && (
              <span className="mt-1 inline-block rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                {user.subscription.plan.name} plan
              </span>
            )}
          </div>
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-slate-50">{children}</main>
    </div>
  );
}
