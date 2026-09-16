'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import IntegrityBadge from '@/components/IntegrityBadge';
import {
  ArrowLeft,
  Calendar,
  User,
  ShieldCheck,
  Lock,
  Clock,
  Send,
  AlertTriangle,
  FileCheck2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function QuestionPaperDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [paperData, setPaperData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const fetchPaper = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/question-papers/${params.id}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load question paper');
      }
      setPaperData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaper();
  }, [params.id]);

  const handleSubmitDraft = async () => {
    if (!confirm('Are you sure you want to submit this draft for official review?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/question-papers/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submitForReview: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionMessage('Paper successfully submitted for review!');
      fetchPaper();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Decrypting AES-256 payload & verifying SHA-256 hash...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Access Denied or Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">{error}</p>
        <Link
          href="/question-papers"
          className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow transition"
        >
          Back to Question Papers
        </Link>
      </div>
    );
  }

  const { paper, contentLocked, lockReason, content, integrityVerified, storedHash, calculatedHash } = paperData;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/question-papers"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {paper.title}
              </h1>
              <StatusBadge status={paper.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {paper.examName} • {paper.subject}
            </p>
          </div>
        </div>

        {paper.status === 'DRAFT' && (
          <button
            onClick={handleSubmitDraft}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition"
          >
            <Send className="w-4 h-4" />
            <span>Submit for Review</span>
          </button>
        )}
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Metadata Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">Author</span>
          <div className="flex items-center gap-1.5 font-medium text-slate-800 mt-1">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>{paper.createdBy?.name}</span>
          </div>
        </div>

        <div>
          <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">Exam Date</span>
          <div className="flex items-center gap-1.5 font-medium text-slate-800 mt-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{paper.examDate}</span>
          </div>
        </div>

        <div>
          <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">Review Status</span>
          <div className="font-medium text-slate-800 mt-1">
            {paper.reviewedBy ? `${paper.reviewedBy.name}` : 'Pending Review'}
          </div>
        </div>

        <div>
          <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">Release Schedule</span>
          <div className="font-medium text-slate-800 mt-1">
            {paper.releaseTime ? new Date(paper.releaseTime).toLocaleString() : 'Not Scheduled'}
          </div>
        </div>
      </div>

      {/* Step 7: Cryptographic Integrity Verification Banner */}
      {!contentLocked && (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Cryptographic Integrity Audit (Methodology Step 7)
          </div>
          <IntegrityBadge isVerified={integrityVerified} hash={storedHash} />

          <div className="bg-slate-900 text-slate-300 p-4 rounded-xl text-xs font-mono space-y-1.5 overflow-x-auto">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-sans font-semibold">
              Integrity Comparison Matrix
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-slate-400 shrink-0 w-32">Database Hash:</span>
              <span className="text-emerald-400 break-all">{storedHash}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-slate-400 shrink-0 w-32">Calculated Hash:</span>
              <span className={integrityVerified ? 'text-emerald-400 break-all' : 'text-rose-400 break-all'}>
                {calculatedHash}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Controlled Release Lock Warning */}
      {contentLocked && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-6 text-center space-y-3">
          <Clock className="w-10 h-10 text-amber-600 mx-auto" />
          <h3 className="text-base font-bold text-amber-900">Document Locked – Controlled Release Active</h3>
          <p className="text-xs text-amber-800 max-w-lg mx-auto">
            {lockReason}
          </p>
          <div className="text-[11px] text-amber-700 bg-amber-100/60 inline-block px-3 py-1.5 rounded-full border border-amber-200">
            Methodology Step 9: Zero-Trust time enforcement prevents pre-examination disclosure.
          </div>
        </div>
      )}

      {/* Decrypted Document Content */}
      {!contentLocked && content && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Decrypted Question Paper (AES-256-GCM)
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Confidential Document</span>
          </div>
          <div className="p-6">
            <pre className="text-xs sm:text-sm font-mono whitespace-pre-wrap text-slate-800 leading-relaxed bg-slate-50/50 p-4 rounded-lg border border-slate-200">
              {content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
