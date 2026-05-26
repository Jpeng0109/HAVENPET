'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const links = [
  { href: '/store/dashboard', label: 'Dashboard' },
  { href: '/store/catalog', label: 'B2B Catalog' },
  { href: '/store/cart', label: 'Cart' },
  { href: '/store/orders', label: 'Orders' },
];

export function StoreSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    localStorage.removeItem('havenpet_token');
    localStorage.removeItem('havenpet_role');
    localStorage.removeItem('havenpet_cart');
    router.push('/login');
  }

  return (
    <aside className="flex w-56 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-5">
        <span className="text-lg font-bold text-brand-700">HAVENPET</span>
        <p className="text-xs text-slate-500">Store Portal</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block rounded-lg px-3 py-2 text-sm font-medium ${
              pathname === link.href
                ? 'bg-brand-50 text-brand-700'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <button
        onClick={logout}
        className="m-3 rounded-lg border px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
      >
        Sign out
      </button>
    </aside>
  );
}
