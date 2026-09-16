import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { getSessionUser, hasRequiredRole } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Please login' }, { status: 401 });
    }

    if (!hasRequiredRole(user, ['ADMIN'])) {
      return NextResponse.json({ error: 'Forbidden: Only Administrators can view users' }, { status: 403 });
    }

    await connectToDatabase();

    // Never return password hashes
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error('Fetch users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
