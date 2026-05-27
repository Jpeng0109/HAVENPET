'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { formatDate, formatDateTime, formatNumber } from './format';
import { getMessage, interpolate } from './messages';
import { LOCALE_STORAGE_KEY, type Locale } from './types';

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  tStatus: (status: string) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (value: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (value: Date | string, options?: Intl.DateTimeFormatOptions) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored === 'en' || stored === 'fil' || stored === 'zh') return stored;
  return 'en';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    setLocaleState(readStoredLocale());
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
    document.documentElement.lang = next === 'zh' ? 'zh-CN' : next === 'fil' ? 'fil' : 'en';
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : locale === 'fil' ? 'fil' : 'en';
  }, [locale]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      interpolate(getMessage(locale, key), params),
    [locale],
  );

  const tStatus = useCallback(
    (status: string) => {
      const key = `status.${status}`;
      const translated = getMessage(locale, key);
      return translated === key ? status.replace(/_/g, ' ') : translated;
    },
    [locale],
  );

  const fmtNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) => formatNumber(locale, value, options),
    [locale],
  );
  const fmtDate = useCallback(
    (value: Date | string, options?: Intl.DateTimeFormatOptions) =>
      formatDate(locale, value, options),
    [locale],
  );
  const fmtDateTime = useCallback(
    (value: Date | string, options?: Intl.DateTimeFormatOptions) =>
      formatDateTime(locale, value, options),
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      tStatus,
      formatNumber: fmtNumber,
      formatDate: fmtDate,
      formatDateTime: fmtDateTime,
    }),
    [locale, setLocale, t, tStatus, fmtNumber, fmtDate, fmtDateTime],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}
