'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/context';

export default function Home() {
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    const token = localStorage.getItem('havenpet_token');
    const role = localStorage.getItem('havenpet_role');
    if (!token) {
      router.replace('/login');
    } else if (role === 'hq_admin') {
      router.replace('/hq/dashboard');
    } else {
      router.replace('/store/dashboard');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-slate-500">{t('common.loading')}</p>
    </div>
  );
}
