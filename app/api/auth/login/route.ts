import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { comparePassword, signSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      await logAuditEvent({
        userName: email,
        action: 'FAILED_LOGIN',
        resource: 'AUTH',
        details: 'User does not exist',
      });
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      await logAuditEvent({
        userId: user._id.toString(),
        userName: user.name,
        action: 'FAILED_LOGIN',
        resource: 'AUTH',
        details: 'Incorrect password attempt',
      });
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const sessionUser = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = signSessionToken(sessionUser);

    await logAuditEvent({
      userId: sessionUser.id,
      userName: sessionUser.name,
      action: 'LOGIN',
      resource: 'AUTH',
      details: `User logged in with role ${sessionUser.role}`,
    });

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Authentication service error' }, { status: 500 });
  }
}
