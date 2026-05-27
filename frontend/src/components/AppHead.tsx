'use client';

import { useEffect } from 'react';
import { useI18n } from '@/i18n/context';

export function AppHead() {
  const { locale, t } = useI18n();

  useEffect(() => {
    document.title = t('meta.title');
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', t('meta.description'));
  }, [locale, t]);

  return null;
}
