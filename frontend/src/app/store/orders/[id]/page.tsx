'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LogisticsTimeline } from '@/components/LogisticsTimeline';
import { useI18n } from '@/i18n/context';
import { TrackingResponse, shipmentsApi } from '@/lib/api';

export default function StoreOrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const { t, tStatus, formatDate } = useI18n();
  const [tracking, setTracking] = useState<TrackingResponse | null>(null);

  useEffect(() => {
    shipmentsApi.track(id).then(setTracking);
  }, [id]);

  if (!tracking) {
    return <p className="text-slate-500">{t('store.tracking.loading')}</p>;
  }

  const { order, shipment, timeline, progress } = tracking;

  return (
    <div className="max-w-2xl">
      <Link href="/store/orders" className="text-sm text-brand-600 hover:underline">
        {t('store.tracking.backToOrders')}
      </Link>
      <h1 className="mt-4 text-2xl font-bold">{order.orderNumber}</h1>
      <p className="text-slate-500">
        {order.store?.name} · {Number(order.totalAmount).toFixed(2)} {order.currency}
      </p>
      <span className="mt-2 inline-block rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
        {tStatus(order.status)}
      </span>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 font-semibold">{t('store.tracking.shipmentTimeline')}</h2>
        <LogisticsTimeline
          timeline={timeline}
          progress={progress}
          carrier={shipment?.carrier}
          trackingNumber={shipment?.trackingNumber}
        />
      </div>

      {shipment && (
        <div className="mt-4 grid gap-2 rounded-xl border bg-slate-50 p-4 text-sm sm:grid-cols-2">
          {shipment.vesselFlight && (
            <p>
              <span className="text-slate-500">{t('store.tracking.vesselFlight')}</span>{' '}
              {shipment.vesselFlight}
            </p>
          )}
          {shipment.containerId && (
            <p>
              <span className="text-slate-500">{t('store.tracking.container')}</span>{' '}
              {shipment.containerId}
            </p>
          )}
          {shipment.originPort && (
            <p>
              <span className="text-slate-500">{t('store.tracking.from')}</span> {shipment.originPort}
            </p>
          )}
          {shipment.destinationPort && (
            <p>
              <span className="text-slate-500">{t('store.tracking.to')}</span> {shipment.destinationPort}
            </p>
          )}
          {shipment.estimatedArrival && (
            <p>
              <span className="text-slate-500">{t('store.tracking.eta')}</span>{' '}
              {formatDate(shipment.estimatedArrival)}
            </p>
          )}
          {shipment.customsNotes && (
            <p className="sm:col-span-2">
              <span className="text-slate-500">{t('store.tracking.customs')}</span> {shipment.customsNotes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
