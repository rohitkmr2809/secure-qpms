'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import {
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Eye,
  ShieldCheck,
  Timer,
  Lock,
  Radio,
} from 'lucide-react';

export default function ReleasePortalPage() {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [schedulingPaper, setSchedulingPaper] = useState<any | null>(null);
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReleasePapers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/question-papers');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Exam officer manages APPROVED, SCHEDULED, and RELEASED papers
      const releaseList = (data.papers || []).filter(
        (p: any) => p.status === 'APPROVED' || p.status === 'SCHEDULED' || p.status === 'RELEASED'
      );
      setPapers(releaseList);
    } catch (err: any) {
      setError(err.message || 'Failed to load papers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleasePapers();
  }, []);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingPaper || !scheduleDateTime) return;
    setActionLoading(true);
    setError('');
    setFeedback('');

    try {
      const res = await fetch('/api/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperId: schedulingPaper._id,
          action: 'SCHEDULE',
          releaseTime: new Date(scheduleDateTime).toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFeedback(`Paper successfully scheduled for release at ${new Date(scheduleDateTime).toLocaleString()}`);
      setSchedulingPaper(null);
      setScheduleDateTime('');
      fetchReleasePapers();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule release');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseNow = async (paperId: string) => {
    if (!confirm('Are you sure you want to officially release this question paper to examination centers?')) return;
    setActionLoading(true);
    setError('');
    setFeedback('');

    try {
      const res = await fetch('/api/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperId,
          action: 'RELEASE',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFeedback('Question paper released successfully! Decryption unlocked for exam centers.');
      fetchReleasePapers();
    } catch (err: any) {
      setError(err.message || 'Release error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Radio className="w-6 h-6 text-indigo-600 animate-pulse" />
            Controlled Examination-Day Release
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Methodology Step 9: Zero-Trust controlled release with strict time-lock enforcement
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Schedule Modal / Box */}
      {schedulingPaper && (
        <div className="bg-white rounded-xl border-2 border-indigo-300 p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                Configure Release Window
              </span>
              <h3 className="text-lg font-bold text-slate-900">{schedulingPaper.title}</h3>
              <p className="text-xs text-slate-500">{schedulingPaper.examName} • {schedulingPaper.subject}</p>
            </div>
            <button
              onClick={() => setSchedulingPaper(null)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleScheduleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Release Date & Exact Time (Local Time)
              </label>
              <input
                type="datetime-local"
                required
                value={scheduleDateTime}
                onChange={(e) => setScheduleDateTime(e.target.value)}
                className="w-full sm:w-80 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Before this timestamp, the content will remain encrypted and inaccessible to test centers.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSchedulingPaper(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition disabled:opacity-50"
              >
                Confirm Schedule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Papers Table */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading release records...</div>
      ) : papers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Clock className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">No approved papers available for release</h3>
          <p className="text-xs text-slate-400 mt-1">
            Question papers must first be approved by a Reviewer before they can be scheduled or released.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Title & Subject</th>
                <th className="px-5 py-3.5">Exam Details</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Scheduled Release Time</th>
                <th className="px-5 py-3.5 text-right">Officer Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {papers.map((paper) => {
                const isScheduled = paper.status === 'SCHEDULED';
                const releaseTime = paper.releaseTime ? new Date(paper.releaseTime) : null;
                const now = new Date();
                const isTimeReached = releaseTime ? now >= releaseTime : true;

                return (
                  <tr key={paper._id.toString()} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4 font-medium text-slate-900">
                      <div className="font-semibold text-sm">{paper.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{paper.subject}</div>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      <div>{paper.examName}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>Exam: {paper.examDate}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={paper.status} />
                    </td>

                    <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                      {releaseTime ? (
                        <div className="space-y-0.5">
                          <div className="font-mono text-[11px] text-slate-800">
                            {releaseTime.toLocaleString()}
                          </div>
                          <div className="text-[10px]">
                            {isTimeReached ? (
                              <span className="text-emerald-600 font-semibold">Time Reached (Ready to Release)</span>
                            ) : (
                              <span className="text-amber-600 font-semibold flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Locked until scheduled time
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Immediate / Unscheduled</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                      <Link
                        href={`/question-papers/${paper._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </Link>

                      {paper.status === 'APPROVED' && (
                        <button
                          onClick={() => {
                            setSchedulingPaper(paper);
                            setScheduleDateTime('');
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg transition"
                        >
                          <Timer className="w-3.5 h-3.5" />
                          <span>Schedule Release</span>
                        </button>
                      )}

                      {(paper.status === 'APPROVED' || paper.status === 'SCHEDULED') && (
                        <button
                          onClick={() => handleReleaseNow(paper._id)}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg shadow transition disabled:opacity-50"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Release Paper</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
