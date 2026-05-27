export type Locale = 'en' | 'fil' | 'zh';

export const LOCALES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'fil', label: 'Filipino' },
  { code: 'zh', label: '中文' },
];

export const LOCALE_STORAGE_KEY = 'havenpet_locale';
