'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useI18n } from '@/i18n/context';
import { Store, storesApi } from '@/lib/api';

const emptyForm = {
  code: '',
  name: '',
  country: '',
  city: '',
  address: '',
  contactName: '',
  contactEmail: '',
  currency: 'EUR',
  taxRate: 0.19,
  importDutyRate: 0.05,
};

export default function HqStoresPage() {
  const { t } = useI18n();
  const [stores, setStores] = useState<Store[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function load() {
    storesApi.list().then(setStores).catch((e) => setError(e.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await storesApi.create(form);
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('hq.stores.createFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(t('hq.stores.deactivateConfirm', { name }))) return;
    await storesApi.remove(id);
    load();
  }

  const formFields = [
    ['code', t('hq.stores.storeCode')],
    ['name', t('common.name')],
    ['country', t('common.country')],
    ['city', t('common.city')],
    ['address', t('common.address')],
    ['contactName', t('hq.stores.contactName')],
    ['contactEmail', t('hq.stores.contactEmail')],
    ['currency', t('common.currency')],
  ] as const;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('hq.stores.title')}</h1>
          <p className="text-slate-500">{t('hq.stores.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {showForm ? t('common.cancel') : t('hq.stores.addStore')}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2"
        >
          {formFields.map(([key, label]) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
              <input
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              {t('hq.stores.taxRate')}
            </label>
            <input
              type="number"
              step="0.01"
              value={form.taxRate}
              onChange={(e) => setForm({ ...form, taxRate: parseFloat(e.target.value) })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              {t('hq.stores.importDutyRate')}
            </label>
            <input
              type="number"
              step="0.01"
              value={form.importDutyRate}
              onChange={(e) => setForm({ ...form, importDutyRate: parseFloat(e.target.value) })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white sm:col-span-2"
          >
            {loading ? t('common.saving') : t('hq.stores.createStore')}
          </button>
        </form>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">{t('common.code')}</th>
              <th className="px-4 py-3">{t('common.name')}</th>
              <th className="px-4 py-3">{t('common.location')}</th>
              <th className="px-4 py-3">{t('common.currency')}</th>
              <th className="px-4 py-3">{t('common.tax')}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {stores.map((s) => (
              <tr key={s.id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-mono text-xs">{s.code}</td>
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-slate-600">
                  {s.city}, {s.country}
                </td>
                <td className="px-4 py-3">{s.currency}</td>
                <td className="px-4 py-3">{(Number(s.taxRate) * 100).toFixed(0)}%</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDelete(s.id, s.name)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    {t('hq.stores.deactivate')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
