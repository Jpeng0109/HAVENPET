'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LowStockItem, authApi, inventoryApi, ordersApi } from '@/lib/api';

export default function StoreDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ firstName: string; store?: { name: string; currency: string } } | null>(null);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [restocking, setRestocking] = useState<string | null>(null);

  useEffect(() => {
    authApi.me().then(setUser);
    inventoryApi.lowStock().then(setLowStock);
  }, []);

  async function generateRestock(skuId: string) {
    setRestocking(skuId);
    try {
      const order = await ordersApi.restock(skuId);
      const submitted = await ordersApi.submit(order.id);
      router.push(`/store/checkout/${submitted.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create restock order');
    } finally {
      setRestocking(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-700">Store Dashboard</h1>
      <p className="text-slate-500">
        {user?.store?.name ?? '...'} — Welcome, {user?.firstName}
        {user?.store?.currency && ` · Currency: ${user.store.currency}`}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => router.push('/store/catalog')}
          className="rounded-xl border border-brand-200 bg-brand-50 p-6 text-left hover:bg-brand-100"
        >
          <p className="font-semibold text-brand-700">Browse B2B Catalog</p>
          <p className="mt-1 text-sm text-slate-600">Place a restock order from HQ warehouse</p>
        </button>
        <button
          onClick={() => router.push('/store/orders')}
          className="rounded-xl border p-6 text-left hover:bg-slate-50"
        >
          <p className="font-semibold">Order History</p>
          <p className="mt-1 text-sm text-slate-600">Track payments and shipment status</p>
        </button>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Low Stock Alerts</h2>
      {lowStock.length === 0 ? (
        <p className="mt-4 text-slate-500">All SKUs above safety threshold.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {lowStock.map((item, i) => (
            <div key={i} className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="font-medium text-red-900">
                {item.sku.product.name} — {item.sku.skuVariantCode}
              </p>
              <p className="mt-1 text-sm text-red-700">
                Stock: <strong>{item.quantity}</strong> / threshold {item.safetyThreshold} ·
                Suggested reorder: {item.reorderQty}
              </p>
              <button
                onClick={() => generateRestock(item.sku.id)}
                disabled={restocking !== null}
                className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {restocking ? 'Creating order...' : 'Generate Restock Order'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
