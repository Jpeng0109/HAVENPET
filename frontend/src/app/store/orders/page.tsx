'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/i18n/context';
import { Order, ordersApi } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  pending_payment: 'bg-amber-100 text-amber-800',
  paid_awaiting_shipment: 'bg-blue-100 text-blue-800',
  shipped_in_transit: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-700',
};

export default function StoreOrdersPage() {
  const { t, tStatus } = useI18n();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    ordersApi.list().then(setOrders);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">{t('store.orders.title')}</h1>
      <div className="mt-6 space-y-3">
        {orders.length === 0 && <p className="text-slate-500">{t('store.orders.noOrders')}</p>}
        {orders.map((o) => (
          <div key={o.id} className="rounded-xl border bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-sm font-medium">{o.orderNumber}</p>
                <p className="text-lg font-bold text-brand-700">
                  {Number(o.totalAmount).toFixed(2)} {o.currency}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  STATUS_COLORS[o.status] ?? 'bg-slate-100'
                }`}
              >
                {tStatus(o.status)}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {t('common.items', { count: o.items.length })}
            </p>
            <div className="mt-3 flex gap-4">
              {o.status === 'pending_payment' && (
                <Link
                  href={`/store/checkout/${o.id}`}
                  className="text-sm font-medium text-brand-600 hover:underline"
                >
                  {t('store.orders.completePayment')}
                </Link>
              )}
              {o.status !== 'draft' && o.status !== 'pending_payment' && o.status !== 'cancelled' && (
                <Link
                  href={`/store/orders/${o.id}`}
                  className="text-sm font-medium text-brand-600 hover:underline"
                >
                  {t('store.orders.trackShipment')}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
