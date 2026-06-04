'use client';

import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { StoreMap } from '@/components/hq/StoreMap';
import { useI18n } from '@/i18n/context';
import { AnalyticsOverview, analyticsApi } from '@/lib/api';

export default function HqDashboardPage() {
  const { t, formatNumber } = useI18n();
  const [data, setData] = useState<AnalyticsOverview | null>(null);

  useEffect(() => {
    analyticsApi.overview().then(setData).catch(console.error);
  }, []);

  if (!data) {
    return <p className="text-slate-500">{t('hq.dashboard.loadingAnalytics')}</p>;
  }

  const { kpis, salesTrend, topSkus, storeRanking, storeMap } = data;

  const kpiCards = [
    { label: t('hq.dashboard.totalGmv'), value: `$${kpis.totalGmvUsd.toLocaleString()}`, accent: 'text-brand-700 bg-brand-50' },
    { label: t('hq.dashboard.b2bOrders'), value: kpis.totalOrders, accent: 'text-blue-700 bg-blue-50' },
    { label: t('hq.dashboard.activeStores'), value: kpis.activeStores, accent: 'text-slate-700 bg-slate-50' },
    { label: t('hq.dashboard.pendingFulfillment'), value: kpis.pendingFulfillment, accent: kpis.pendingFulfillment > 0 ? 'text-amber-700 bg-amber-50' : 'text-slate-700 bg-slate-50' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('hq.dashboard.title')}</h1>
        <p className="mt-1 text-slate-500">{t('hq.dashboard.subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((c) => (
          <div key={c.label} className={`rounded-xl border border-slate-200 p-5 ${c.accent}`}>
            <p className="text-sm font-medium opacity-80">{c.label}</p>
            <p className="mt-2 text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">{t('hq.dashboard.salesTrend')}</h2>
          <p className="text-xs text-slate-500">{t('hq.dashboard.salesTrendHint')}</p>
          <div className="mt-4 h-64">
            {salesTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`$${formatNumber(v)}`, t('hq.dashboard.gmv')]} />
                  <Line type="monotone" dataKey="gmvUsd" stroke="#2d6a4f" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center justify-center text-sm text-slate-400">
                {t('hq.dashboard.noSalesData')}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">{t('hq.dashboard.topSkus')}</h2>
          <p className="text-xs text-slate-500">{t('hq.dashboard.topSkusHint')}</p>
          <div className="mt-4 h-64">
            {topSkus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSkus} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="skuVariantCode" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [`$${formatNumber(v)}`, t('hq.dashboard.revenue')]} />
                  <Bar dataKey="revenueUsd" fill="#40916c" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center justify-center text-sm text-slate-400">
                {t('hq.dashboard.noSkuData')}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 font-semibold">{t('hq.dashboard.storeLocations')}</h2>
          <StoreMap stores={storeMap} />
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
            {storeMap.map((s) => (
              <span key={s.id}>
                {s.code}: ${formatNumber(s.revenueUsd)}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 font-semibold">{t('hq.dashboard.storeLeaderboard')}</h2>
          <div className="space-y-2">
            {storeRanking.map((store, i) => (
              <div key={store.storeCode} className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    i === 0
                      ? 'bg-amber-400 text-white'
                      : i === 1
                        ? 'bg-slate-300 text-slate-700'
                        : i === 2
                          ? 'bg-amber-700/80 text-white'
                          : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium">{store.storeName}</p>
                  <p className="text-xs text-slate-500">
                    {store.storeCode} · {t('hq.dashboard.b2bOrdersCount', { count: store.orderCount })}
                  </p>
                </div>
                <p className="font-bold text-brand-700">${formatNumber(store.revenueUsd)}</p>
              </div>
            ))}
            {storeRanking.length === 0 && (
              <p className="text-sm text-slate-500">{t('hq.dashboard.noStoreRevenue')}</p>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        {t('hq.dashboard.footer', {
          b2b: formatNumber(kpis.b2bGmvUsd),
          retail: formatNumber(kpis.retailGmvUsd),
          completed: kpis.completedOrders,
        })}
      </p>
    </div>
  );
}
