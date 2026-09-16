import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import QuestionPaper from '@/models/QuestionPaper';
import AuditLog from '@/models/AuditLog';
import User from '@/models/User';
import {
  FileText,
  Clock,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  FilePlus,
  ShieldAlert,
  Users,
  CheckSquare,
  Lock,
} from 'lucide-react';

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  await connectToDatabase();

  const [
    totalPapers,
    submittedCount,
    approvedCount,
    scheduledCount,
    releasedCount,
    draftCount,
    totalUsers,
    totalLogs,
    recentLogs,
  ] = await Promise.all([
    QuestionPaper.countDocuments(),
    QuestionPaper.countDocuments({ status: 'SUBMITTED' }),
    QuestionPaper.countDocuments({ status: 'APPROVED' }),
    QuestionPaper.countDocuments({ status: 'SCHEDULED' }),
    QuestionPaper.countDocuments({ status: 'RELEASED' }),
    QuestionPaper.countDocuments({ status: 'DRAFT' }),
    User.countDocuments(),
    AuditLog.countDocuments(),
    AuditLog.find().sort({ timestamp: -1 }).limit(6),
  ]);

  let userPapersCount = 0;
  if (user.role === 'QUESTION_SETTER') {
    userPapersCount = await QuestionPaper.countDocuments({ 'createdBy.id': user.id });
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-medium border border-emerald-500/30 mb-3">
            <ShieldCheck className="w-3.5 h-3.5" /> Zero-Trust Security Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome, {user.name}
          </h1>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            You are authenticated as <span className="font-semibold text-emerald-400">{user.role.replace('_', ' ')}</span>.
            All document views, cryptographic integrity checks, and status modifications are actively audited.
          </p>

          <div className="flex flex-wrap gap-3 mt-5">
            {(user.role === 'QUESTION_SETTER' || user.role === 'ADMIN') && (
              <Link
                href="/question-papers/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition"
              >
                <FilePlus className="w-4 h-4" /> Create New Paper
              </Link>
            )}
            {(user.role === 'REVIEWER' || user.role === 'ADMIN') && (
              <Link
                href="/review"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow transition"
              >
                <CheckSquare className="w-4 h-4" /> Review Queue ({submittedCount})
              </Link>
            )}
            {(user.role === 'EXAM_OFFICER' || user.role === 'ADMIN') && (
              <Link
                href="/release"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition"
              >
                <Clock className="w-4 h-4" /> Controlled Release ({scheduledCount + approvedCount})
              </Link>
            )}
            {user.role === 'ADMIN' && (
              <Link
                href="/audit-logs"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg shadow transition"
              >
                <ShieldAlert className="w-4 h-4" /> View Audit Logs ({totalLogs})
              </Link>
            )}
          </div>
        </div>

        <div className="absolute right-6 bottom-6 opacity-10 hidden md:block pointer-events-none">
          <ShieldCheck className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Papers</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalPapers}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {user.role === 'QUESTION_SETTER' ? `${userPapersCount} authored by you` : `${draftCount} in draft`}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{submittedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting reviewer sign-off</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{approvedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Ready for scheduling</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Scheduled</span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-600">{scheduledCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Locked until exam time</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Released</span>
            <ShieldCheck className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-bold text-teal-600">{releasedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Dispatched to exam centers</div>
        </div>
      </div>

      {/* Two Column Section: Security Pipeline & Recent Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Security Pipeline Card (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Security Methodology Pipeline</h2>
              <p className="text-xs text-slate-500">Live demonstration of Zero-Trust lifecycle controls</p>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Steps 1–11
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-600" /> AES-256-GCM Encryption
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Question papers are stored as authenticated ciphertext with IV & authTag. Zero plaintext copies in MongoDB.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> SHA-256 Integrity Verification
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                A 256-bit cryptographic digest is generated upon finalization and verified upon release to detect any tampering.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-600" /> Multi-Role Segregation (RBAC)
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Setters cannot approve. Reviewers cannot release. Officers cannot edit. No single insider can compromise a paper.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" /> Controlled Release Guard
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Papers remain locked and inaccessible until predefined release time, enforced by strict server-side timestamps.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Audit Activity Snapshot (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Audit Stream</h2>
              {user.role === 'ADMIN' && (
                <Link href="/audit-logs" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                  View All
                </Link>
              )}
            </div>

            <div className="space-y-3">
              {recentLogs.map((log: any) => (
                <div key={log._id.toString()} className="border-l-2 border-slate-300 pl-3 py-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-800">{log.userName}</span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-xs font-mono font-medium text-emerald-700 mt-0.5">
                    {log.action}
                  </div>
                  {log.details && (
                    <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {log.details}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center font-mono">
            {totalLogs} total immutable audit records stored
          </div>
        </div>
      </div>
    </div>
  );
}
