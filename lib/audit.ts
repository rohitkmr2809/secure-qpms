import { connectToDatabase } from '@/lib/mongodb';
import AuditLog, { AuditAction } from '@/models/AuditLog';

interface LogAuditEventParams {
  userId?: string;
  userName?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
}

/**
 * Records an immutable audit log entry.
 * Methodology Step 8: Continuous Monitoring and Auditing
 */
export async function logAuditEvent(params: LogAuditEventParams): Promise<void> {
  try {
    await connectToDatabase();
    await AuditLog.create({
      userId: params.userId || 'system',
      userName: params.userName || 'Anonymous/System',
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId || 'N/A',
      details: params.details || '',
      ipAddress: params.ipAddress || '127.0.0.1',
      timestamp: new Date(),
    });
  } catch (error) {
    // Audit log should not break main execution flow, but should log server-side
    console.error('Failed to write audit log:', error);
  }
}
