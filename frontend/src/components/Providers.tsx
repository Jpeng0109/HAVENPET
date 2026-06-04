'use client';

import { AppHead } from '@/components/AppHead';
import { I18nProvider } from '@/i18n/context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AppHead />
      {children}
    </I18nProvider>
  );
}
