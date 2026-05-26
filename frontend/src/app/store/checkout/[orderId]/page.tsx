'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Order, ordersApi, paymentsApi } from '@/lib/api';

const METHODS = [
  { id: 'credit_card', label: 'Credit Card', instant: true },
  { id: 'stripe', label: 'Stripe', instant: true },
  { id: 'paypal', label: 'PayPal', instant: true },
  { id: 'bank_wire', label: 'Bank Wire Transfer', instant: false },
];

export default function CheckoutPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [method, setMethod] = useState('credit_card');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    ordersApi.get(orderId).then(setOrder);
  }, [orderId]);

  async function pay() {
    setLoading(true);
    setError('');
    try {
      await paymentsApi.create(
        orderId,
        method,
        method === 'bank_wire' ? receiptUrl : undefined,
      );
      setDone(true);
      setTimeout(() => router.push('/store/orders'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  }

  if (!order) return <p className="text-slate-500">Loading order...</p>;

  const selected = METHODS.find((m) => m.id === method);

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <p className="text-slate-500">{order.orderNumber}</p>

      <div className="mt-6 rounded-xl border bg-white p-5">
        <p className="text-3xl font-bold text-brand-700">
          {Number(order.totalAmount).toFixed(2)} {order.currency}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          incl. VAT {Number(order.taxAmount).toFixed(2)} · Duty{' '}
          {Number(order.dutyAmount).toFixed(2)} · Shipping{' '}
          {Number(order.shippingAmount).toFixed(2)}
        </p>
      </div>

      {done ? (
        <div className="mt-6 rounded-xl bg-green-50 p-4 text-green-800">
          {method === 'bank_wire'
            ? 'Wire transfer submitted. Awaiting HQ approval.'
            : 'Payment successful! Redirecting to orders...'}
        </div>
      ) : (
        <>
          <h2 className="mt-6 font-semibold">Payment Method</h2>
          <div className="mt-3 space-y-2">
            {METHODS.map((m) => (
              <label
                key={m.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                  method === m.id ? 'border-brand-500 bg-brand-50' : ''
                }`}
              >
                <input
                  type="radio"
                  name="method"
                  value={m.id}
                  checked={method === m.id}
                  onChange={() => setMethod(m.id)}
                />
                <span className="text-sm font-medium">{m.label}</span>
                {m.instant && (
                  <span className="ml-auto text-xs text-green-600">Instant</span>
                )}
              </label>
            ))}
          </div>

          {method === 'bank_wire' && (
            <div className="mt-4">
              <label className="text-sm text-slate-600">Receipt URL (upload elsewhere, paste link)</label>
              <input
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
          )}

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <button
            onClick={pay}
            disabled={loading || (method === 'bank_wire' && !receiptUrl)}
            className="mt-6 w-full rounded-lg bg-brand-600 py-3 font-semibold text-white disabled:opacity-60"
          >
            {loading
              ? 'Processing...'
              : selected?.instant
                ? `Pay ${Number(order.totalAmount).toFixed(2)} ${order.currency}`
                : 'Submit Wire Transfer'}
          </button>
        </>
      )}
    </div>
  );
}
