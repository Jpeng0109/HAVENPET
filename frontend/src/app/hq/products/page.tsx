'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Product, productsApi } from '@/lib/api';

export default function HqProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [skuProductId, setSkuProductId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [productForm, setProductForm] = useState({
    skuCode: '',
    name: '',
    category: 'dry_food',
    basePriceUsd: 0,
    description: '',
  });
  const [skuForm, setSkuForm] = useState({
    skuVariantCode: '',
    flavour: '',
    weightLabel: '',
    priceUsd: 0,
    initialHqStock: 0,
  });

  function load() {
    productsApi.list().then(setProducts).catch((e) => setError(e.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function createProduct(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await productsApi.create(productForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function createSku(e: FormEvent) {
    e.preventDefault();
    if (!skuProductId) return;
    setError('');
    try {
      await productsApi.createSku(skuProductId, skuForm);
      setSkuProductId(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Product Catalog</h1>
          <p className="text-slate-500">Manage products and SKU variants</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
        >
          {showForm ? 'Cancel' : '+ Add Product'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createProduct} className="mt-6 grid gap-3 rounded-xl border bg-white p-6 sm:grid-cols-2">
          {(
            [
              ['skuCode', 'Product Code'],
              ['name', 'Name'],
              ['category', 'Category'],
              ['basePriceUsd', 'Base Price USD'],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="text-xs text-slate-600">{label}</label>
              <input
                type={key === 'basePriceUsd' ? 'number' : 'text'}
                value={productForm[key]}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    [key]: key === 'basePriceUsd' ? parseFloat(e.target.value) : e.target.value,
                  })
                }
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                required
              />
            </div>
          ))}
          <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white sm:col-span-2">
            Create Product
          </button>
        </form>
      )}

      {skuProductId && (
        <form onSubmit={createSku} className="mt-4 grid gap-3 rounded-xl border border-brand-200 bg-brand-50 p-6 sm:grid-cols-2">
          <p className="text-sm font-medium text-brand-700 sm:col-span-2">Add SKU variant</p>
          {(
            [
              ['skuVariantCode', 'SKU Code'],
              ['flavour', 'Flavour'],
              ['weightLabel', 'Weight'],
              ['priceUsd', 'Price USD'],
              ['initialHqStock', 'Initial HQ Stock'],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="text-xs text-slate-600">{label}</label>
              <input
                type={key.includes('Usd') || key.includes('Stock') ? 'number' : 'text'}
                value={skuForm[key]}
                onChange={(e) =>
                  setSkuForm({
                    ...skuForm,
                    [key]:
                      key === 'skuVariantCode' || key === 'flavour' || key === 'weightLabel'
                        ? e.target.value
                        : parseFloat(e.target.value),
                  })
                }
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                required={key !== 'initialHqStock'}
              />
            </div>
          ))}
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white">
              Add SKU
            </button>
            <button type="button" onClick={() => setSkuProductId(null)} className="rounded-lg border px-4 py-2 text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 space-y-4">
        {products.map((p) => (
          <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-xs text-slate-500">
                  {p.skuCode} · {p.category} · ${p.basePriceUsd}
                </p>
              </div>
              <button
                onClick={() => setSkuProductId(p.id)}
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                + Add SKU
              </button>
            </div>
            {p.skus.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {p.skus.map((s) => (
                  <span
                    key={s.id}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                  >
                    {s.skuVariantCode}
                    {s.flavour && ` · ${s.flavour}`}
                    {s.weightLabel && ` · ${s.weightLabel}`}
                    {' · $'}
                    {s.priceUsd}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
