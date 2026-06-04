import type { Locale } from '../types';
import en from './en';
import fil from './fil';
import zh from './zh';

export const messages = { en, fil, zh } as const;

export type MessageKey = string;

export function getMessage(locale: Locale, key: string): string {
  const parts = key.split('.');
  let current: unknown = messages[locale];
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      current = undefined;
      break;
    }
  }
  if (typeof current === 'string') return current;
  // fallback to English
  let fallback: unknown = messages.en;
  for (const part of parts) {
    if (fallback && typeof fallback === 'object' && part in fallback) {
      fallback = (fallback as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  return typeof fallback === 'string' ? fallback : key;
}

export function interpolate(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
    template,
  );
}
