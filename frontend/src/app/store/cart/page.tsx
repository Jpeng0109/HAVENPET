'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/context';
import { CartItem, clearCart, getCart, removeFromCart, updateCartQty } from '@/lib/cart';
import { OrderPreview, ordersApi } from '@/lib/api';

export default function StoreCartPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [preview, setPreview] = useState<OrderPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function refresh() {
    setCart(getCart());
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (cart.length === 0) {
      setPreview(null);
      return;
    }
    ordersApi
      .preview(cart.map((c) => ({ skuId: c.skuId, quantity: c.quantity })))
      .then(setPreview)
      .catch((e) => setError(e.message));
  }, [cart]);

  async function checkout() {
    if (!cart.length) return;
    setLoading(true);
    setError('');
    try {
      const order = await ordersApi.create(cart.map((c) => ({ skuId: c.skuId, quantity: c.quantity })));
      const submitted = await ordersApi.submit(order.id);
      clearCart();
      router.push(`/store/checkout/${submitted.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('store.cart.checkoutFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">{t('store.cart.title')}</h1>
      {cart.length === 0 ? (
        <p className="mt-6 text-slate-500">
          {t('store.cart.empty')}{' '}
          <button onClick={() => router.push('/store/catalog')} className="text-brand-600 underline">
            {t('store.cart.browseCatalog')}
          </button>
        </p>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            {cart.map((item) => (
              <div key={item.skuId} className="flex items-center justify-between rounded-xl border bg-white p-4">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-xs text-slate-500">{item.skuVariantCode}</p>
                  <p className="text-sm text-brand-700">
                    {t('store.cart.each', {
                      price: item.priceLocal.toFixed(2),
                      currency: item.currency,
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={item.hqAvailable}
                    value={item.quantity}
                    onChange={(e) => {
                      updateCartQty(item.skuId, parseInt(e.target.value, 10) || 1);
                      refresh();
                    }}
                    className="w-16 rounded border px-2 py-1 text-sm"
                  />
                  <button
                    onClick={() => {
                      removeFromCart(item.skuId);
                      refresh();
                    }}
                    className="text-xs text-red-600"
                  >
                    {t('common.remove')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {preview && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 h-fit">
              <h2 className="font-semibold">{t('store.cart.orderSummary')}</h2>
              <p className="text-xs text-slate-500 mt-1">
                {t('store.cart.fxRate', { rate: preview.exchangeRate, currency: preview.currency })}
              </p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt>{t('store.cart.subtotal')}</dt>
                  <dd>
                    {preview.subtotalLocal.toFixed(2)} {preview.currency}
                  </dd>
                </div>
                <div className="flex justify-between text-slate-600">
                  <dt>{t('store.cart.vat', { rate: (preview.breakdown.taxRate * 100).toFixed(0) })}</dt>
                  <dd>{preview.taxAmount.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between text-slate-600">
                  <dt>{t('store.cart.importDuty', { rate: (preview.breakdown.dutyRate * 100).toFixed(0) })}</dt>
                  <dd>{preview.dutyAmount.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between text-slate-600">
                  <dt>{t('store.cart.shipping')}</dt>
                  <dd>{preview.shippingAmount.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between border-t pt-2 font-bold text-base">
                  <dt>{t('store.cart.total')}</dt>
                  <dd className="text-brand-700">
                    {preview.totalAmount.toFixed(2)} {preview.currency}
                  </dd>
                </div>
              </dl>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              <button
                onClick={checkout}
                disabled={loading}
                className="mt-4 w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading ? t('store.cart.processing') : t('store.cart.placeOrder')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
