import { NextResponse } from 'next/server';
import { getSessionUser, SESSION_COOKIE_NAME } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST() {
  try {
    const user = await getSessionUser();

    if (user) {
      await logAuditEvent({
        userId: user.id,
        userName: user.name,
        action: 'LOGOUT',
        resource: 'AUTH',
        details: 'User logged out',
      });
    }

    const response = NextResponse.json({ success: true, message: 'Logged out' });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: '',
      httpOnly: true,
      path: '/',
      expires: new Date(0),
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: 'Logout error' }, { status: 500 });
  }
}
