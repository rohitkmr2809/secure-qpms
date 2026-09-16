'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  FilePlus,
  CheckSquare,
  Clock,
  ShieldAlert,
  Users,
  Lock,
} from 'lucide-react';

interface SidebarProps {
  userRole?: string;
}

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'QUESTION_SETTER', 'REVIEWER', 'EXAM_OFFICER'],
    },
    {
      name: 'Question Papers',
      href: '/question-papers',
      icon: FileText,
      roles: ['ADMIN', 'QUESTION_SETTER', 'REVIEWER', 'EXAM_OFFICER'],
    },
    {
      name: 'Create / Upload',
      href: '/question-papers/create',
      icon: FilePlus,
      roles: ['ADMIN', 'QUESTION_SETTER'],
    },
    {
      name: 'Review Papers',
      href: '/review',
      icon: CheckSquare,
      roles: ['ADMIN', 'REVIEWER'],
    },
    {
      name: 'Controlled Release',
      href: '/release',
      icon: Clock,
      roles: ['ADMIN', 'EXAM_OFFICER'],
    },
    {
      name: 'Audit Logs',
      href: '/audit-logs',
      icon: ShieldAlert,
      roles: ['ADMIN'],
    },
    {
      name: 'User Management',
      href: '/users',
      icon: Users,
      roles: ['ADMIN'],
    },
  ];

  const filteredItems = navItems.filter(
    (item) => !userRole || item.roles.includes(userRole)
  );

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
      <div>
        <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase px-3 mb-2">
          Navigation
        </div>
        <nav className="space-y-1">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 font-semibold border-l-4 border-emerald-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-8 pt-4 border-t border-slate-100">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 mb-1">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            Zero-Trust Protocol
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            All documents are stored encrypted (AES-256-GCM) with continuous audit logging.
          </p>
        </div>
      </div>
    </aside>
  );
}
