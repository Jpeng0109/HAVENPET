'use client';

import { useI18n } from '@/i18n/context';
import type { Locale } from '@/i18n/types';

const LOCALE_CODES: Locale[] = ['en', 'fil', 'zh'];

type Props = {
  className?: string;
  compact?: boolean;
};

export function LanguageSwitcher({ className = '', compact = false }: Props) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className={className}>
      {!compact && (
        <label className="mb-1 block text-xs font-medium text-slate-500">
          {t('common.language')}
        </label>
      )}
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as typeof locale)}
        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        aria-label={t('common.language')}
      >
        {LOCALE_CODES.map((code) => (
          <option key={code} value={code}>
            {t(`locales.${code}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
