import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import QuestionPaper from '@/models/QuestionPaper';
import AuditLog from '@/models/AuditLog';
import User from '@/models/User';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Please login' }, { status: 401 });
    }

    await connectToDatabase();

    const [
      totalPapers,
      submittedCount,
      approvedCount,
      scheduledCount,
      releasedCount,
      draftCount,
      totalUsers,
      totalLogs,
      recentLogs,
    ] = await Promise.all([
      QuestionPaper.countDocuments(),
      QuestionPaper.countDocuments({ status: 'SUBMITTED' }),
      QuestionPaper.countDocuments({ status: 'APPROVED' }),
      QuestionPaper.countDocuments({ status: 'SCHEDULED' }),
      QuestionPaper.countDocuments({ status: 'RELEASED' }),
      QuestionPaper.countDocuments({ status: 'DRAFT' }),
      User.countDocuments(),
      AuditLog.countDocuments(),
      AuditLog.find().sort({ timestamp: -1 }).limit(5),
    ]);

    // Role-specific counts
    let myPapersCount = 0;
    if (user.role === 'QUESTION_SETTER') {
      myPapersCount = await QuestionPaper.countDocuments({ 'createdBy.id': user.id });
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalPapers,
        submittedCount,
        approvedCount,
        scheduledCount,
        releasedCount,
        draftCount,
        totalUsers,
        totalLogs,
        myPapersCount,
      },
      recentLogs,
    });
  } catch (error: any) {
    console.error('Stats fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch system stats' }, { status: 500 });
  }
}
