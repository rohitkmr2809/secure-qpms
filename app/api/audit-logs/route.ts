import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import AuditLog from '@/models/AuditLog';
import { getSessionUser, hasRequiredRole } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Please login' }, { status: 401 });
    }

    // RBAC: Only Admin can view comprehensive audit logs
    if (!hasRequiredRole(user, ['ADMIN'])) {
      return NextResponse.json({ error: 'Forbidden: Only Administrators can inspect audit logs' }, { status: 403 });
    }

    await connectToDatabase();

    const logs = await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(100);

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error('Audit logs fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
