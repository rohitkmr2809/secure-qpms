'use client';

import React, { useEffect, useState } from 'react';
import { Users, Shield, Calendar, Mail, AlertTriangle } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/users');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setUsers(data.users || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch user directory');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const getRoleBadge = (role: string) => {
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-slate-700" />
          Authorized User Directory
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Methodology Step 1: User Registration and Identity Verification with Role Segregation
        </p>
      </div>

      {error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-rose-800 text-xs">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <div className="font-semibold">{error}</div>
          <p className="mt-1">Only users with the ADMIN role can view registered users.</p>
        </div>
      ) : loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading authorized personnel...</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Official Email</th>
                <th className="px-5 py-3.5">Assigned Role (RBAC)</th>
                <th className="px-5 py-3.5">Registered On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u._id.toString()} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-4 font-semibold text-slate-900">
                    {u.name}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{u.email}</span>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase ${getRoleBadge(
                        u.role
                      )}`}
                    >
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
