import React from 'react';
import { PaperStatus } from '@/models/QuestionPaper';
import { Clock, CheckCircle2, XCircle, Calendar, ShieldCheck, FileEdit } from 'lucide-react';

interface StatusBadgeProps {
  status: PaperStatus;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const configs: Record<PaperStatus, { label: string; bg: string; text: string; border: string; icon: any }> = {
    DRAFT: {
      label: 'Draft',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-300',
      icon: FileEdit,
    },
    SUBMITTED: {
      label: 'Submitted for Review',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-300',
      icon: Clock,
    },
    APPROVED: {
      label: 'Approved',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-300',
      icon: CheckCircle2,
    },
    REJECTED: {
      label: 'Rejected',
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-300',
      icon: XCircle,
    },
    SCHEDULED: {
      label: 'Scheduled',
      bg: 'bg-indigo-50',
      text: 'text-indigo-800',
      border: 'border-indigo-300',
      icon: Calendar,
    },
    RELEASED: {
      label: 'Released',
      bg: 'bg-teal-50',
      text: 'text-teal-800',
      border: 'border-teal-400',
      icon: ShieldCheck,
    },
  };

  const config = configs[status] || configs.DRAFT;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}
