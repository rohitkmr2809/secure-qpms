'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Eye,
  Calendar,
  User,
  ShieldCheck,
  AlertCircle,
  Clock,
} from 'lucide-react';

export default function ReviewPortalPage() {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPaper, setSelectedPaper] = useState<any | null>(null);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const fetchSubmittedPapers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/question-papers');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Review queue prioritizes SUBMITTED papers
      const reviewList = (data.papers || []).filter(
        (p: any) => p.status === 'SUBMITTED' || p.status === 'APPROVED' || p.status === 'REJECTED'
      );
      setPapers(reviewList);
    } catch (err: any) {
      setError(err.message || 'Failed to load review queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmittedPapers();
  }, []);

  const handleDecision = async (decision: 'APPROVE' | 'REJECT') => {
    if (!selectedPaper) return;
    setSubmitting(true);
    setError('');
    setFeedback('');

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperId: selectedPaper._id,
          decision,
          remarks,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFeedback(data.message || `Question paper ${decision.toLowerCase()}d successfully`);
      setSelectedPaper(null);
      setRemarks('');
      fetchSubmittedPapers();
    } catch (err: any) {
      setError(err.message || 'Failed to process decision');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-amber-600" />
            Review & Approval Portal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Methodology Step 6: Multi-level review to prevent single-point insider compromise
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

      {/* Review Modal / Drawer when a paper is selected */}
      {selectedPaper && (
        <div className="bg-white rounded-xl border-2 border-amber-300 p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                Action Required
              </span>
              <h3 className="text-lg font-bold text-slate-900">{selectedPaper.title}</h3>
              <p className="text-xs text-slate-500">
                {selectedPaper.examName} • {selectedPaper.subject}
              </p>
            </div>
            <button
              onClick={() => setSelectedPaper(null)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Reviewer Assessment / Remarks
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Provide justification for approval or grounds for rejection (logged to immutable audit trail)..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link
              href={`/question-papers/${selectedPaper._id}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:underline"
            >
              <Eye className="w-4 h-4" />
              <span>Inspect Full Content & Verify SHA-256 (Opens in new tab)</span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleDecision('REJECT')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow transition disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject Paper</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleDecision('APPROVE')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Paper</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submitted Papers Table */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading review queue...</div>
      ) : papers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Clock className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">No question papers pending review</h3>
          <p className="text-xs text-slate-400 mt-1">
            When question setters submit papers, they will appear in this review queue.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Title & Subject</th>
                <th className="px-5 py-3.5">Exam Details</th>
                <th className="px-5 py-3.5">Author</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {papers.map((paper) => (
                <tr key={paper._id.toString()} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-4 font-medium text-slate-900">
                    <div className="font-semibold text-sm">{paper.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{paper.subject}</div>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    <div>{paper.examName}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>{paper.examDate}</span>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{paper.createdBy?.name}</span>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge status={paper.status} />
                  </td>

                  <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                    <Link
                      href={`/question-papers/${paper._id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </Link>

                    {paper.status === 'SUBMITTED' && (
                      <button
                        onClick={() => setSelectedPaper(paper)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow transition"
                      >
                        <span>Evaluate</span>
                      </button>
                    )}
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
