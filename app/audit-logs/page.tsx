'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, RefreshCw, Filter, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/audit-logs');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLogs(data.logs || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadgeColor = (action: string) => {
    if (action.includes('FAIL') || action.includes('REJECT')) {
      return 'bg-rose-50 text-rose-700 border-rose-300';
    }
    if (action.includes('PASS') || action.includes('APPROVE') || action.includes('RELEASE')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-300';
    }
    if (action.includes('LOGIN')) {
      return 'bg-blue-50 text-blue-700 border-blue-300';
    }
    if (action.includes('CREATE') || action.includes('SUBMIT')) {
      return 'bg-purple-50 text-purple-700 border-purple-300';
    }
    return 'bg-slate-100 text-slate-700 border-slate-300';
  };

  const filteredLogs = logs.filter((log) => {
    if (filterAction === 'ALL') return true;
    return log.action === filterAction;
  });

  const uniqueActions = ['ALL', ...Array.from(new Set(logs.map((l) => l.action)))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-purple-600" />
            Security Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Methodology Step 8: Tamper-evident immutable audit log of all system activities
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-transparent focus:outline-none text-slate-700 font-medium"
            >
              {uniqueActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg shadow-sm transition disabled:opacity-50"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-rose-800 text-xs">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <div className="font-semibold">{error}</div>
          <p className="mt-1">Only users with the ADMIN role can inspect security audit logs.</p>
        </div>
      ) : loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading audit records...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
          No audit logs found for the selected filter.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Action</th>
                  <th className="px-5 py-3.5">Resource</th>
                  <th className="px-5 py-3.5">Audit Details</th>
                  <th className="px-5 py-3.5">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredLogs.map((log) => (
                  <tr key={log._id.toString()} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    <td className="px-5 py-3.5 text-slate-900 font-sans font-semibold whitespace-nowrap">
                      {log.userName}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap font-sans">
                      {log.resource}
                    </td>

                    <td className="px-5 py-3.5 text-slate-700 font-sans max-w-md break-words">
                      {log.details || '—'}
                    </td>

                    <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
