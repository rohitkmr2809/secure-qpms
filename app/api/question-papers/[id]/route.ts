import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import QuestionPaper from '@/models/QuestionPaper';
import { getSessionUser, hasRequiredRole } from '@/lib/auth';
import { decryptContent, encryptContent } from '@/lib/encryption';
import { generateSHA256, verifySHA256 } from '@/lib/hashing';
import { logAuditEvent } from '@/lib/audit';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Please login' }, { status: 401 });
    }

    await connectToDatabase();
    const paper = await QuestionPaper.findById(params.id);

    if (!paper) {
      return NextResponse.json({ error: 'Question paper not found' }, { status: 404 });
    }

    // Role-based Access Control checks
    if (user.role === 'QUESTION_SETTER' && paper.createdBy.id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You can only view your own question papers' }, { status: 403 });
    }

    if (user.role === 'REVIEWER' && paper.status === 'DRAFT') {
      return NextResponse.json({ error: 'Forbidden: Reviewers cannot access unsubmitted drafts' }, { status: 403 });
    }

    // Controlled Release check for EXAM_OFFICER or general viewing
    let contentLocked = false;
    let lockReason = '';
    const now = new Date();

    if (paper.status === 'SCHEDULED' && paper.releaseTime && new Date(paper.releaseTime) > now) {
      // If user is not Admin or Setter inspecting their past paper, lock content until release time
      if (user.role !== 'ADMIN' && user.role !== 'QUESTION_SETTER') {
        contentLocked = true;
        lockReason = `Paper content is locked until scheduled release time: ${new Date(paper.releaseTime).toLocaleString()}`;
      }
    }

    let decryptedText = '';
    let integrityVerified = false;

    if (!contentLocked) {
      // Decrypt AES-256-GCM content
      decryptedText = decryptContent(paper.content);

      // Verify SHA-256 Integrity
      integrityVerified = verifySHA256(decryptedText, paper.integrityHash);

      await logAuditEvent({
        userId: user.id,
        userName: user.name,
        action: integrityVerified ? 'INTEGRITY_CHECK_PASS' : 'INTEGRITY_CHECK_FAIL',
        resource: 'QUESTION_PAPER',
        resourceId: paper._id.toString(),
        details: integrityVerified
          ? 'SHA-256 checksum matched stored hash. Document verified intact.'
          : 'CRITICAL: SHA-256 checksum mismatch! Possible document tampering detected.',
      });
    }

    await logAuditEvent({
      userId: user.id,
      userName: user.name,
      action: 'VIEW_QUESTION_PAPER',
      resource: 'QUESTION_PAPER',
      resourceId: paper._id.toString(),
      details: `Viewed question paper "${paper.title}". Content locked: ${contentLocked}`,
    });

    return NextResponse.json({
      success: true,
      paper: {
        _id: paper._id,
        title: paper.title,
        subject: paper.subject,
        examName: paper.examName,
        examDate: paper.examDate,
        status: paper.status,
        integrityHash: paper.integrityHash,
        createdBy: paper.createdBy,
        reviewedBy: paper.reviewedBy,
        reviewedAt: paper.reviewedAt,
        reviewRemarks: paper.reviewRemarks,
        releaseTime: paper.releaseTime,
        releasedBy: paper.releasedBy,
        releasedAt: paper.releasedAt,
        createdAt: paper.createdAt,
        updatedAt: paper.updatedAt,
      },
      contentLocked,
      lockReason,
      content: contentLocked ? null : decryptedText,
      integrityVerified: contentLocked ? null : integrityVerified,
      storedHash: paper.integrityHash,
      calculatedHash: contentLocked ? null : generateSHA256(decryptedText),
    });
  } catch (error: any) {
    console.error('Fetch paper details error:', error);
    return NextResponse.json({ error: 'Failed to fetch question paper' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Please login' }, { status: 401 });
    }

    await connectToDatabase();
    const paper = await QuestionPaper.findById(params.id);

    if (!paper) {
      return NextResponse.json({ error: 'Question paper not found' }, { status: 404 });
    }

    // Only creator or admin can edit, and only in DRAFT or REJECTED status
    if (user.role !== 'ADMIN' && paper.createdBy.id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You cannot edit this paper' }, { status: 403 });
    }

    if (paper.status !== 'DRAFT' && paper.status !== 'REJECTED' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: `Cannot edit paper with status ${paper.status}` }, { status: 400 });
    }

    const { title, subject, examName, examDate, content, submitForReview } = await request.json();

    if (title) paper.title = title;
    if (subject) paper.subject = subject;
    if (examName) paper.examName = examName;
    if (examDate) paper.examDate = examDate;

    if (content) {
      paper.integrityHash = generateSHA256(content);
      paper.content = encryptContent(content);
    }

    if (submitForReview) {
      paper.status = 'SUBMITTED';
    }

    await paper.save();

    const action = submitForReview ? 'SUBMIT_QUESTION_PAPER' : 'UPDATE_QUESTION_PAPER';
    await logAuditEvent({
      userId: user.id,
      userName: user.name,
      action,
      resource: 'QUESTION_PAPER',
      resourceId: paper._id.toString(),
      details: submitForReview
        ? `Paper "${paper.title}" submitted for review.`
        : `Updated draft "${paper.title}".`,
    });

    return NextResponse.json({
      success: true,
      message: submitForReview ? 'Paper submitted for review' : 'Draft updated successfully',
      paper,
    });
  } catch (error: any) {
    console.error('Update paper error:', error);
    return NextResponse.json({ error: 'Failed to update question paper' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Please login' }, { status: 401 });
    }

    await connectToDatabase();
    const paper = await QuestionPaper.findById(params.id);

    if (!paper) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    if (user.role !== 'ADMIN' && (paper.createdBy.id !== user.id || paper.status !== 'DRAFT')) {
      return NextResponse.json({ error: 'Forbidden: You can only delete your own draft papers' }, { status: 403 });
    }

    await QuestionPaper.findByIdAndDelete(params.id);

    await logAuditEvent({
      userId: user.id,
      userName: user.name,
      action: 'UPDATE_QUESTION_PAPER',
      resource: 'QUESTION_PAPER',
      resourceId: params.id,
      details: `Deleted paper "${paper.title}"`,
    });

    return NextResponse.json({ success: true, message: 'Question paper deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete question paper' }, { status: 500 });
  }
}
