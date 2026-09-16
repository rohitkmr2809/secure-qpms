import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import QuestionPaper from '@/models/QuestionPaper';
import { getSessionUser, hasRequiredRole } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Please login' }, { status: 401 });
    }

    // Step 5: RBAC - Only EXAM_OFFICER or ADMIN can schedule or release papers
    if (!hasRequiredRole(user, ['EXAM_OFFICER', 'ADMIN'])) {
      return NextResponse.json({ error: 'Forbidden: Only Examination Officers can schedule or release question papers' }, { status: 403 });
    }

    const { paperId, action, releaseTime } = await request.json();

    if (!paperId || !['SCHEDULE', 'RELEASE'].includes(action)) {
      return NextResponse.json({ error: 'Valid paperId and action (SCHEDULE/RELEASE) are required' }, { status: 400 });
    }

    await connectToDatabase();
    const paper = await QuestionPaper.findById(paperId);

    if (!paper) {
      return NextResponse.json({ error: 'Question paper not found' }, { status: 404 });
    }

    if (action === 'SCHEDULE') {
      if (paper.status !== 'APPROVED' && paper.status !== 'SCHEDULED') {
        return NextResponse.json({ error: `Only APPROVED papers can be scheduled for release. Current status: ${paper.status}` }, { status: 400 });
      }

      if (!releaseTime) {
        return NextResponse.json({ error: 'Release time is required to schedule' }, { status: 400 });
      }

      paper.status = 'SCHEDULED';
      paper.releaseTime = new Date(releaseTime);
      await paper.save();

      await logAuditEvent({
        userId: user.id,
        userName: user.name,
        action: 'SCHEDULE_RELEASE',
        resource: 'QUESTION_PAPER',
        resourceId: paper._id.toString(),
        details: `Scheduled paper "${paper.title}" for release at ${new Date(releaseTime).toISOString()}`,
      });

      return NextResponse.json({
        success: true,
        message: 'Question paper scheduled for release successfully',
        paper,
      });
    }

    if (action === 'RELEASE') {
      if (paper.status !== 'SCHEDULED' && paper.status !== 'APPROVED') {
        return NextResponse.json({ error: `Cannot release paper with status "${paper.status}". Must be APPROVED or SCHEDULED.` }, { status: 400 });
      }

      // Step 9: Controlled Release Time Enforcement
      if (paper.releaseTime) {
        const now = new Date();
        const scheduledTime = new Date(paper.releaseTime);
        if (now < scheduledTime) {
          const remainingMinutes = Math.ceil((scheduledTime.getTime() - now.getTime()) / (1000 * 60));
          return NextResponse.json({
            error: `Release time has not been reached. Paper will unlock in ${remainingMinutes} minute(s) at ${scheduledTime.toLocaleTimeString()}.`,
          }, { status: 400 });
        }
      }

      paper.status = 'RELEASED';
      paper.releasedBy = {
        id: user.id,
        name: user.name,
        email: user.email,
      };
      paper.releasedAt = new Date();
      await paper.save();

      await logAuditEvent({
        userId: user.id,
        userName: user.name,
        action: 'RELEASE_QUESTION_PAPER',
        resource: 'QUESTION_PAPER',
        resourceId: paper._id.toString(),
        details: `Formally released paper "${paper.title}". Decryption available to authorized centers.`,
      });

      return NextResponse.json({
        success: true,
        message: 'Question paper released successfully',
        paper,
      });
    }
  } catch (error: any) {
    console.error('Release action error:', error);
    return NextResponse.json({ error: 'Failed to process release action' }, { status: 500 });
  }
}
