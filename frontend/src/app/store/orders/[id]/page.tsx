'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LogisticsTimeline } from '@/components/LogisticsTimeline';
import { TrackingResponse, shipmentsApi } from '@/lib/api';

export default function StoreOrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const [tracking, setTracking] = useState<TrackingResponse | null>(null);

  useEffect(() => {
    shipmentsApi.track(id).then(setTracking);
  }, [id]);

  if (!tracking) {
    return <p className="text-slate-500">Loading tracking...</p>;
  }

  const { order, shipment, timeline, progress } = tracking;

  return (
    <div className="max-w-2xl">
      <Link href="/store/orders" className="text-sm text-brand-600 hover:underline">
        ← Back to orders
      </Link>
      <h1 className="mt-4 text-2xl font-bold">{order.orderNumber}</h1>
      <p className="text-slate-500">
        {order.store?.name} · {Number(order.totalAmount).toFixed(2)} {order.currency}
      </p>
      <span className="mt-2 inline-block rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
        {order.status.replace(/_/g, ' ')}
      </span>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 font-semibold">Shipment Timeline</h2>
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
            <p><span className="text-slate-500">Vessel/Flight:</span> {shipment.vesselFlight}</p>
          )}
          {shipment.containerId && (
            <p><span className="text-slate-500">Container:</span> {shipment.containerId}</p>
          )}
          {shipment.originPort && (
            <p><span className="text-slate-500">From:</span> {shipment.originPort}</p>
          )}
          {shipment.destinationPort && (
            <p><span className="text-slate-500">To:</span> {shipment.destinationPort}</p>
          )}
          {shipment.estimatedArrival && (
            <p>
              <span className="text-slate-500">ETA:</span>{' '}
              {new Date(shipment.estimatedArrival).toLocaleDateString()}
            </p>
          )}
          {shipment.customsNotes && (
            <p className="sm:col-span-2">
              <span className="text-slate-500">Customs:</span> {shipment.customsNotes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
