'use client';

import { useEffect, useState } from 'react';
import { Payment, paymentsApi } from '@/lib/api';

export default function HqPaymentsPage() {
  const [pending, setPending] = useState<Payment[]>([]);

  function load() {
    paymentsApi.pendingWire().then(setPending);
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: string) {
    await paymentsApi.approve(id);
    load();
  }

  async function reject(id: string) {
    await paymentsApi.reject(id, 'Invalid receipt');
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Wire Transfer Approvals</h1>
      <p className="text-slate-500">Review bank wire receipts from overseas stores</p>

      {pending.length === 0 ? (
        <p className="mt-8 text-slate-500">No pending wire transfers.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {pending.map((p) => (
            <div key={p.id} className="rounded-xl border bg-white p-5">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{p.order?.store?.name}</p>
                  <p className="text-sm text-slate-500">{p.order?.orderNumber}</p>
                  <p className="mt-2 text-lg font-bold text-brand-700">
                    {Number(p.amount).toFixed(2)} {p.currency}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approve(p.id)}
                    className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => reject(p.id)}
                    className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600"
                  >
                    Reject
                  </button>
                </div>
              </div>
              {p.wireReceiptUrl && (
                <a
                  href={p.wireReceiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block text-sm text-brand-600 hover:underline"
                >
                  View receipt →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
