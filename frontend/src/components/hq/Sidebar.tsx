'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useI18n } from '@/i18n/context';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();

  const links = [
    { href: '/hq/dashboard', label: t('nav.dashboard') },
    { href: '/hq/stores', label: t('nav.stores') },
    { href: '/hq/products', label: t('nav.products') },
    { href: '/hq/inventory', label: t('nav.lowStock') },
    { href: '/hq/fulfillment', label: t('nav.fulfillment') },
    { href: '/hq/payments', label: t('nav.wireApprovals') },
  ];

  function logout() {
    localStorage.removeItem('havenpet_token');
    localStorage.removeItem('havenpet_role');
    router.push('/login');
  }

  return (
    <aside className="flex w-56 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-5">
        <span className="text-lg font-bold text-brand-700">HAVENPET</span>
        <p className="text-xs text-slate-500">{t('nav.hqConsole')}</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
              pathname === link.href
                ? 'bg-brand-50 text-brand-700'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="space-y-2 border-t border-slate-200 p-3">
        <LanguageSwitcher compact />
        <button
          onClick={logout}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          {t('common.signOut')}
        </button>
      </div>
    </aside>
  );
}
