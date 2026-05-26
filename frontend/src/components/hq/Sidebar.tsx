'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const links = [
  { href: '/hq/dashboard', label: 'Dashboard' },
  { href: '/hq/stores', label: 'Stores' },
  { href: '/hq/products', label: 'Products' },
  { href: '/hq/inventory', label: 'Low Stock' },
  { href: '/hq/fulfillment', label: 'Fulfillment' },
  { href: '/hq/payments', label: 'Wire Approvals' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    localStorage.removeItem('havenpet_token');
    localStorage.removeItem('havenpet_role');
    router.push('/login');
  }

  return (
    <aside className="flex w-56 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-5">
        <span className="text-lg font-bold text-brand-700">HAVENPET</span>
        <p className="text-xs text-slate-500">HQ Console</p>
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
      <button
        onClick={logout}
        className="m-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
      >
        Sign out
      </button>
    </aside>
  );
}
