'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';

type Role = 'admin' | 'sales' | 'sanction' | 'disbursement' | 'collection' | 'borrower';

// Which modules each role can access
const ROLE_ACCESS: Record<Role, string[]> = {
  admin:        ['sales', 'sanction', 'disbursement', 'collection'],
  sales:        ['sales'],
  sanction:     ['sanction'],
  disbursement: ['disbursement'],
  collection:   ['collection'],
  borrower:     [],
};

const MODULES = [
  { key: 'sales',        label: 'Sales',        icon: '👥', desc: 'Lead tracking' },
  { key: 'sanction',     label: 'Sanction',      icon: '✅', desc: 'Approve / Reject' },
  { key: 'disbursement', label: 'Disbursement',  icon: '💸', desc: 'Release funds' },
  { key: 'collection',   label: 'Collection',    icon: '🏦', desc: 'Record payments' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace('/login'); return; }
    if (user.role === 'borrower') { router.replace('/apply'); return; }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role === 'borrower') return null;

  const allowedModules = ROLE_ACCESS[user.role] || [];

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 text-white flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-base font-bold">L</div>
            <div>
              <p className="font-bold text-sm">LMS Portal</p>
              <p className="text-slate-400 text-xs capitalize">{user.role} view</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {MODULES.filter((m) => allowedModules.includes(m.key)).map((m) => {
            const href = `/dashboard/${m.key}`;
            const active = pathname === href;
            return (
              <Link
                key={m.key}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm
                  ${active
                    ? 'bg-brand-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
              >
                <span className="text-base">{m.icon}</span>
                <div>
                  <p className="font-medium leading-none">{m.label}</p>
                  <p className={`text-xs mt-0.5 ${active ? 'text-brand-200' : 'text-slate-500'}`}>{m.desc}</p>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User info + Logout */}
        <div className="px-4 py-4 border-t border-slate-700">
          <p className="text-sm font-medium text-white truncate">{user.name}</p>
          <p className="text-xs text-slate-400 truncate mb-3">{user.email}</p>
          <button
            onClick={logout}
            className="w-full text-left text-xs text-slate-400 hover:text-red-400 transition-colors"
          >
            → Sign out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}