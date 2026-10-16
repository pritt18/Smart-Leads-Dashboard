/**
 * DashboardPage.tsx — Live metric cards derived from real API data.
 *
 * States:
 *  - Loading: MetricCardSkeleton placeholders
 *  - Error: AlertBanner with retry button
 *  - Success: Five metric cards + status breakdown list
 *
 * All numbers come from GET /api/v1/leads/metrics — nothing is hardcoded.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMetrics } from '../api/leads.api';
import type { LeadMetrics } from '../types/lead.types';
import { LEAD_STATUSES } from '../types/lead.types';
import { formatCurrency, formatPercent, extractErrorMessage } from '../utils/formatters';
import { MetricCardSkeleton, Skeleton } from '../components/common/Skeleton';
import { AlertBanner } from '../components/common/AlertBanner';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

// ── Metric card ──────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
}

function MetricCard({ label, value, sub, icon, iconBg }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
        </div>
        <div className={`rounded-xl p-3 ${iconBg}`}>{icon}</div>
      </div>
    </div>
  );
}

// ── Status row ───────────────────────────────────────────────────────────────

function StatusBreakdown({ byStatus, total }: { byStatus: LeadMetrics['byStatus']; total: number }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-gray-700">Leads by Status</h2>
      <ul className="space-y-3">
        {LEAD_STATUSES.map((status) => {
          const count = byStatus[status] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <li key={status} className="flex items-center gap-3">
              <Badge status={status} />
              <div className="flex-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <span className="w-8 text-right text-sm font-medium text-gray-700">{count}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<LeadMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchMetrics() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMetrics();
      setMetrics(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void fetchMetrics(); }, []);

  // ── Loading state ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)}
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <Skeleton className="mb-4 h-4 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-1.5 flex-1" />
                <Skeleton className="h-4 w-6" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-4">
        <AlertBanner message={error} />
        <Button variant="secondary" onClick={() => void fetchMetrics()}>
          Try again
        </Button>
      </div>
    );
  }

  // ── Empty state (no leads yet) ───────────────────────────────────────────
  if (metrics && metrics.totalLeads === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-20 text-center">
        <svg className="mb-4 h-14 w-14 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h2 className="text-lg font-semibold text-gray-900">No data yet</h2>
        <p className="mt-1 text-sm text-gray-500">Add your first lead to start seeing metrics here.</p>
        <Link to="/leads" className="mt-6">
          <Button variant="primary">Go to Leads</Button>
        </Link>
      </div>
    );
  }

  // ── Success state ────────────────────────────────────────────────────────
  const m = metrics!;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Leads"
          value={m.totalLeads}
          icon={
            <svg className="h-6 w-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          iconBg="bg-brand-50"
        />
        <MetricCard
          label="Pipeline Value"
          value={formatCurrency(m.totalValue)}
          sub="Total estimated deal value"
          icon={
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBg="bg-green-50"
        />
        <MetricCard
          label="New This Month"
          value={m.thisMonth}
          sub="Created in current calendar month"
          icon={
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          iconBg="bg-blue-50"
        />
        <MetricCard
          label="Win Rate"
          value={formatPercent(m.conversionRate)}
          sub="Won / total closed leads"
          icon={
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          iconBg="bg-yellow-50"
        />
      </div>

      {/* Status breakdown */}
      <StatusBreakdown byStatus={m.byStatus} total={m.totalLeads} />
    </div>
  );
}
