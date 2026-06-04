import type { Locale } from './types';

export function intlLocale(locale: Locale): string {
  switch (locale) {
    case 'fil':
      return 'fil-PH';
    case 'zh':
      return 'zh-CN';
    default:
      return 'en-US';
  }
}

export function formatNumber(
  locale: Locale,
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return value.toLocaleString(intlLocale(locale), options);
}

export function formatDate(
  locale: Locale,
  value: Date | string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleDateString(intlLocale(locale), options);
}

export function formatDateTime(
  locale: Locale,
  value: Date | string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleString(intlLocale(locale), options);
}
