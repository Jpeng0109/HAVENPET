'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CatalogProduct, catalogApi } from '@/lib/api';
import { addToCart } from '@/lib/cart';

export default function StoreCatalogPage() {
  const router = useRouter();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [added, setAdded] = useState<string | null>(null);

  useEffect(() => {
    catalogApi.list().then(setProducts);
  }, []);

  function handleAdd(
    product: CatalogProduct,
    sku: CatalogProduct['skus'][0],
    qty: number,
  ) {
    if (sku.hqAvailable < 1) return;
    addToCart({
      skuId: sku.id,
      skuVariantCode: sku.skuVariantCode,
      productName: product.name,
      flavour: sku.flavour,
      weightLabel: sku.weightLabel,
      priceUsd: sku.priceUsd,
      priceLocal: sku.priceLocal,
      currency: sku.currency,
      hqAvailable: sku.hqAvailable,
    }, qty);
    setAdded(sku.id);
    setTimeout(() => setAdded(null), 1500);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">B2B Product Catalog</h1>
          <p className="text-slate-500">Prices shown in your local currency (live FX conversion)</p>
        </div>
        <button
          onClick={() => router.push('/store/cart')}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
        >
          View Cart →
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {products.map((p) => (
          <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold">{p.name}</h3>
            <p className="text-xs text-slate-500">{p.skuCode} · {p.category}</p>
            <div className="mt-4 space-y-2">
              {p.skus.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-3"
                >
                  <div>
                    <p className="font-medium text-sm">{s.skuVariantCode}</p>
                    <p className="text-xs text-slate-500">
                      {[s.flavour, s.weightLabel].filter(Boolean).join(' · ')}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-700">
                      {s.priceLocal.toFixed(2)} {s.currency}
                      <span className="ml-2 font-normal text-slate-400">
                        (${s.priceUsd.toFixed(2)} USD)
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">HQ available: {s.hqAvailable}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={s.hqAvailable < 1}
                      onClick={() => handleAdd(p, s, 1)}
                      className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                    >
                      {added === s.id ? 'Added ✓' : '+ Cart'}
                    </button>
                    {s.hqAvailable >= 10 && (
                      <button
                        onClick={() => handleAdd(p, s, 10)}
                        className="rounded-lg border px-3 py-1.5 text-xs"
                      >
                        +10
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
