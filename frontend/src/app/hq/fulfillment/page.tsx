'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useI18n } from '@/i18n/context';
import { FulfillmentOrder, shipmentsApi } from '@/lib/api';

export default function HqFulfillmentPage() {
  const { t, tStatus } = useI18n();
  const [orders, setOrders] = useState<FulfillmentOrder[]>([]);
  const [shipOrderId, setShipOrderId] = useState<string | null>(null);
  const [form, setForm] = useState({
    carrier: 'Maersk',
    trackingNumber: '',
    containerId: '',
    vesselFlight: '',
    originPort: 'Shanghai',
    destinationPort: 'Hamburg',
    estimatedArrival: '',
    customsNotes: '',
  });
  const [advanceNotes, setAdvanceNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const NEXT_ACTION: Record<string, { label: string; hint: string }> = {
    paid_awaiting_shipment: {
      label: t('hq.fulfillment.shipOrder'),
      hint: t('hq.fulfillment.shipHint'),
    },
    shipped_in_transit: {
      label: t('hq.fulfillment.markCustoms'),
      hint: t('hq.fulfillment.customsHint'),
    },
    customs_clearance: {
      label: t('hq.fulfillment.markArrived'),
      hint: t('hq.fulfillment.arrivedHint'),
    },
    arrived_at_store: {
      label: t('hq.fulfillment.completeOrder'),
      hint: t('hq.fulfillment.completeHint'),
    },
  };

  function load() {
    shipmentsApi.fulfillment().then(setOrders);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleShip(e: FormEvent) {
    e.preventDefault();
    if (!shipOrderId) return;
    setLoading(true);
    try {
      await shipmentsApi.ship({ orderId: shipOrderId, ...form });
      setShipOrderId(null);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('hq.fulfillment.shipFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function handleAdvance(orderId: string) {
    setLoading(true);
    try {
      await shipmentsApi.advance(orderId, advanceNotes || undefined);
      setAdvanceNotes('');
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('hq.fulfillment.advanceFailed'));
    } finally {
      setLoading(false);
    }
  }

  const formFields = [
    ['carrier', t('hq.fulfillment.carrier')],
    ['trackingNumber', t('hq.fulfillment.trackingNumber')],
    ['containerId', t('hq.fulfillment.containerId')],
    ['vesselFlight', t('hq.fulfillment.vesselFlight')],
    ['originPort', t('hq.fulfillment.originPort')],
    ['destinationPort', t('hq.fulfillment.destinationPort')],
    ['estimatedArrival', t('hq.fulfillment.estArrival')],
  ] as const;

  return (
    <div>
      <h1 className="text-2xl font-bold">{t('hq.fulfillment.title')}</h1>
      <p className="text-slate-500">{t('hq.fulfillment.subtitle')}</p>

      {shipOrderId && (
        <form onSubmit={handleShip} className="mt-6 grid gap-3 rounded-xl border bg-white p-6 sm:grid-cols-2">
          <p className="font-semibold text-brand-700 sm:col-span-2">{t('hq.fulfillment.createShipment')}</p>
          {formFields.map(([key, label]) => (
            <div key={key}>
              <label className="text-xs text-slate-600">{label}</label>
              <input
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                required={key === 'carrier' || key === 'trackingNumber'}
              />
            </div>
          ))}
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={loading} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white">
              {t('hq.fulfillment.confirmShipment')}
            </button>
            <button type="button" onClick={() => setShipOrderId(null)} className="rounded-lg border px-4 py-2 text-sm">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 space-y-4">
        {orders.length === 0 && <p className="text-slate-500">{t('hq.fulfillment.noOrders')}</p>}
        {orders.map((o) => {
          const action = NEXT_ACTION[o.status];
          return (
            <div key={o.id} className="rounded-xl border bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono font-medium">{o.orderNumber}</p>
                  <p className="text-sm text-slate-600">
                    {o.store.name} ({o.store.code}) · {o.store.city}
                  </p>
                  <p className="mt-1 text-lg font-bold text-brand-700">
                    {Number(o.totalAmount).toFixed(2)} {o.currency}
                  </p>
                  <span className="mt-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
                    {tStatus(o.status)}
                  </span>
                </div>
                <div className="text-right text-sm">
                  {o.shipment?.trackingNumber && (
                    <p className="font-mono text-slate-600">{o.shipment.trackingNumber}</p>
                  )}
                  {o.shipment?.carrier && <p>{o.shipment.carrier}</p>}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {o.status === 'paid_awaiting_shipment' && (
                  <button
                    onClick={() => setShipOrderId(o.id)}
                    className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    {action?.label ?? t('hq.fulfillment.ship')}
                  </button>
                )}
                {o.status !== 'paid_awaiting_shipment' && action && (
                  <>
                    <input
                      placeholder={t('common.notesOptional')}
                      value={advanceNotes}
                      onChange={(e) => setAdvanceNotes(e.target.value)}
                      className="rounded-lg border px-3 py-2 text-sm"
                    />
                    <button
                      onClick={() => handleAdvance(o.id)}
                      disabled={loading}
                      className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                      {action.label}
                    </button>
                  </>
                )}
              </div>
              {action?.hint && o.status !== 'paid_awaiting_shipment' && (
                <p className="mt-2 text-xs text-slate-400">{action.hint}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
