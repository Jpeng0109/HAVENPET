'use client';

type StorePin = {
  id: string;
  code: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  revenueUsd: number;
};

export function StoreMap({ stores }: { stores: StorePin[] }) {
  const maxRev = Math.max(...stores.map((s) => s.revenueUsd), 1);

  function project(lat: number, lng: number) {
    const x = ((lng + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x, y };
  }

  return (
    <div className="relative aspect-[2/1] w-full overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-slate-100 to-slate-200">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, #94a3b8 1px, transparent 1px),
            radial-gradient(circle at 60% 70%, #94a3b8 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />
      <p className="absolute left-3 top-3 text-xs font-medium text-slate-500">Global Store Network</p>
      {stores.map((store) => {
        const { x, y } = project(store.latitude, store.longitude);
        const size = 10 + (store.revenueUsd / maxRev) * 18;
        return (
          <div
            key={store.id}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
            title={`${store.name} — $${store.revenueUsd.toLocaleString()}`}
          >
            <span
              className="block rounded-full bg-brand-600 shadow-lg ring-2 ring-white transition group-hover:scale-125"
              style={{ width: size, height: size }}
            />
            <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs text-white group-hover:block">
              {store.name}
              <br />
              ${store.revenueUsd.toLocaleString()} USD
            </div>
          </div>
        );
      })}
      {stores.length === 0 && (
        <p className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
          No store coordinates configured
        </p>
      )}
    </div>
  );
}
