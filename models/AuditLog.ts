import mongoose, { Schema, Document, Model } from 'mongoose';

export type AuditAction =
  | 'LOGIN'
  | 'FAILED_LOGIN'
  | 'LOGOUT'
  | 'CREATE_QUESTION_PAPER'
  | 'UPDATE_QUESTION_PAPER'
  | 'SUBMIT_QUESTION_PAPER'
  | 'APPROVE_QUESTION_PAPER'
  | 'REJECT_QUESTION_PAPER'
  | 'SCHEDULE_RELEASE'
  | 'RELEASE_QUESTION_PAPER'
  | 'VIEW_QUESTION_PAPER'
  | 'INTEGRITY_CHECK_PASS'
  | 'INTEGRITY_CHECK_FAIL';

export interface IAuditLog extends Document {
  userId: string;
  userName: string;
  action: AuditAction;
  resource: string;
  resourceId: string;
  details?: string;
  ipAddress?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    action: {
      type: String,
      required: true,
      enum: [
        'LOGIN',
        'FAILED_LOGIN',
        'LOGOUT',
        'CREATE_QUESTION_PAPER',
        'UPDATE_QUESTION_PAPER',
        'SUBMIT_QUESTION_PAPER',
        'APPROVE_QUESTION_PAPER',
        'REJECT_QUESTION_PAPER',
        'SCHEDULE_RELEASE',
        'RELEASE_QUESTION_PAPER',
        'VIEW_QUESTION_PAPER',
        'INTEGRITY_CHECK_PASS',
        'INTEGRITY_CHECK_FAIL',
      ],
    },
    resource: { type: String, required: true },
    resourceId: { type: String, default: 'N/A' },
    details: { type: String, default: '' },
    ipAddress: { type: String, default: '127.0.0.1' },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  }
);

const AuditLog: Model<IAuditLog> = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;
