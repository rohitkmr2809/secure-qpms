'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-6 px-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-lg mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            QPMS Secure Login
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Zero-Trust Cloud Management for Competitive Examination Papers
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Official Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@qpms.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>Sign In Securely</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Demo Accounts (College Viva)
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">Click to prefill</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('admin@qpms.com', 'Admin@123')}
                className="text-left p-2 rounded border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 transition"
              >
                <div className="text-xs font-bold">Admin</div>
                <div className="text-[10px] text-purple-700">admin@qpms.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('setter@qpms.com', 'Setter@123')}
                className="text-left p-2 rounded border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 transition"
              >
                <div className="text-xs font-bold">Question Setter</div>
                <div className="text-[10px] text-blue-700">setter@qpms.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('reviewer@qpms.com', 'Reviewer@123')}
                className="text-left p-2 rounded border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 transition"
              >
                <div className="text-xs font-bold">Reviewer</div>
                <div className="text-[10px] text-amber-700">reviewer@qpms.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('officer@qpms.com', 'Officer@123')}
                className="text-left p-2 rounded border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 transition"
              >
                <div className="text-xs font-bold">Exam Officer</div>
                <div className="text-[10px] text-emerald-700">officer@qpms.com</div>
              </button>
            </div>
          </div>
        </div>

        {/* Zero-Trust Notice */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Passwords hashed with bcrypt • Zero plaintext storage</span>
        </div>
      </div>
    </div>
  );
}
