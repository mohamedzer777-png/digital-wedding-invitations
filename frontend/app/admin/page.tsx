'use client';

import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Users, CalendarHeart, UserCheck, Send } from 'lucide-react';
import { useSystemAnalytics } from '@/lib/hooks/useAdmin';
import { apiErrorMessage } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <Icon size={22} />
      </span>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </Card>
  );
}

const BAR_COLORS = ['#ec4884', '#6366f1', '#16a34a', '#f59e0b'];

export default function AdminOverviewPage() {
  const { data, isLoading, isError, error } = useSystemAnalytics();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const chartData = data
    ? [
        { name: 'Users', value: data.users },
        { name: 'Events', value: data.events },
        { name: 'Guests', value: data.guests },
        { name: 'Messages', value: data.messages },
      ]
    : [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Platform overview</h1>
        <p className="mt-1 text-sm text-slate-500">System-wide metrics across all tenants.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : isError ? (
        <Card className="p-6 text-sm text-red-700">{apiErrorMessage(error)}</Card>
      ) : data ? (
        <>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Users} label="Registered users" value={data.users} />
            <StatCard icon={CalendarHeart} label="Events created" value={data.events} />
            <StatCard icon={UserCheck} label="Guests" value={data.guests} />
            <StatCard icon={Send} label="Messages" value={data.messages} />
          </div>

          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Totals at a glance</h2>
            {!mounted ? (
              <div className="flex h-[300px] items-center justify-center">
                <Spinner />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}
