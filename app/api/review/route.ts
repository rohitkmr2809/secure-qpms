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

    // Step 5: RBAC - Only REVIEWER or ADMIN
    if (!hasRequiredRole(user, ['REVIEWER', 'ADMIN'])) {
      return NextResponse.json({ error: 'Forbidden: Only Reviewers can approve or reject papers' }, { status: 403 });
    }

    const { paperId, decision, remarks } = await request.json();

    if (!paperId || !['APPROVE', 'REJECT'].includes(decision)) {
      return NextResponse.json({ error: 'Valid paperId and decision (APPROVE/REJECT) are required' }, { status: 400 });
    }

    await connectToDatabase();
    const paper = await QuestionPaper.findById(paperId);

    if (!paper) {
      return NextResponse.json({ error: 'Question paper not found' }, { status: 404 });
    }

    if (paper.status !== 'SUBMITTED') {
      return NextResponse.json({ error: `Paper is currently in status "${paper.status}". Only SUBMITTED papers can be reviewed.` }, { status: 400 });
    }

    const newStatus = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    paper.status = newStatus;
    paper.reviewedBy = {
      id: user.id,
      name: user.name,
      email: user.email,
    };
    paper.reviewedAt = new Date();
    paper.reviewRemarks = remarks || (decision === 'APPROVE' ? 'Approved by reviewer.' : 'Rejected during review.');

    await paper.save();

    const auditAction = decision === 'APPROVE' ? 'APPROVE_QUESTION_PAPER' : 'REJECT_QUESTION_PAPER';
    await logAuditEvent({
      userId: user.id,
      userName: user.name,
      action: auditAction,
      resource: 'QUESTION_PAPER',
      resourceId: paper._id.toString(),
      details: `${decision === 'APPROVE' ? 'Approved' : 'Rejected'} paper "${paper.title}". Remarks: ${paper.reviewRemarks}`,
    });

    return NextResponse.json({
      success: true,
      message: `Question paper ${newStatus.toLowerCase()} successfully`,
      paper,
    });
  } catch (error: any) {
    console.error('Review action error:', error);
    return NextResponse.json({ error: 'Failed to process review' }, { status: 500 });
  }
}
