'use client';

import { useEffect, useState } from 'react';
import { LowStockItem, inventoryApi } from '@/lib/api';

export default function HqInventoryPage() {
  const [items, setItems] = useState<LowStockItem[]>([]);

  useEffect(() => {
    inventoryApi.lowStock().then(setItems);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">Low Stock Alerts</h1>
      <p className="text-slate-500">SKUs below safety threshold across all stores</p>

      {items.length === 0 ? (
        <p className="mt-8 text-slate-500">No low stock alerts.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4"
            >
              <div>
                <p className="font-medium text-red-900">
                  {item.sku.product.name} — {item.sku.skuVariantCode}
                  {item.sku.flavour && ` (${item.sku.flavour})`}
                </p>
                {item.store && (
                  <p className="text-sm text-red-700">
                    {item.store.name} ({item.store.code})
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-red-700">
                  {item.quantity} / {item.safetyThreshold}
                </p>
                <p className="text-xs text-red-600">Reorder: {item.reorderQty} units</p>
                <button className="mt-2 rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white opacity-60">
                  Generate Restock Order (Step 3)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
