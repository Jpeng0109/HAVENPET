'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/hq/Sidebar';

export default function HqLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('havenpet_token');
    const role = localStorage.getItem('havenpet_role');
    if (!token) router.replace('/login');
    else if (role !== 'hq_admin') router.replace('/store/dashboard');
  }, [router]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
