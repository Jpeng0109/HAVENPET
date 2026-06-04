'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StoreSidebar } from '@/components/store/Sidebar';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('havenpet_token');
    const role = localStorage.getItem('havenpet_role');
    if (!token) router.replace('/login');
    else if (role === 'hq_admin') router.replace('/hq/dashboard');
  }, [router]);

  return (
    <div className="flex min-h-screen">
      <StoreSidebar />
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
