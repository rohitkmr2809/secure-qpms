'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, LogOut, User, Lock } from 'lucide-react';

interface NavbarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'QUESTION_SETTER':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'REVIEWER':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'EXAM_OFFICER':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="bg-emerald-600 p-2 rounded-lg text-white shadow group-hover:bg-emerald-500 transition">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold tracking-tight text-base sm:text-lg flex items-center gap-2">
              QPMS <span className="hidden sm:inline text-xs font-normal text-slate-400">| Secure Examination Portal</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> AES-256-GCM / SHA-256 ZERO-TRUST
            </div>
          </div>
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-slate-200">{user.name}</div>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getRoleBadge(user.role)}`}>
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
              title="Sign out securely"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow transition"
          >
            <User className="w-3.5 h-3.5" />
            <span>Login</span>
          </Link>
        )}
      </div>
    </header>
  );
}
