import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

interface IntegrityBadgeProps {
  isVerified: boolean | null;
  hash?: string;
  className?: string;
}

export default function IntegrityBadge({ isVerified, hash, className = '' }: IntegrityBadgeProps) {
  if (isVerified === null || isVerified === undefined) {
    return null;
  }

  if (isVerified) {
    return (
      <div className={`flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-sm ${className}`}>
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-emerald-900">Integrity verified</div>
          <div className="text-xs text-emerald-700 font-mono mt-0.5 break-all">
            SHA-256 Checksum: {hash ? `${hash.substring(0, 32)}...` : 'Matched'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-lg text-sm ${className}`}>
      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
      <div>
        <div className="font-semibold text-rose-900">
          Integrity verification failed. The document may have been modified.
        </div>
        <div className="text-xs text-rose-700 mt-0.5">
          Calculated SHA-256 does not match the database cryptographic signature. Access may be compromised.
        </div>
      </div>
    </div>
  );
}
