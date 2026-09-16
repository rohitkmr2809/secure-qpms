import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import QuestionPaper from '@/models/QuestionPaper';
import { getSessionUser, hasRequiredRole } from '@/lib/auth';
import { encryptContent } from '@/lib/encryption';
import { generateSHA256 } from '@/lib/hashing';
import { logAuditEvent } from '@/lib/audit';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Please login' }, { status: 401 });
    }

    await connectToDatabase();

    let query: any = {};

    // Role-based visibility filtering
    if (user.role === 'QUESTION_SETTER') {
      query = { 'createdBy.id': user.id };
    } else if (user.role === 'REVIEWER') {
      query = { status: { $in: ['SUBMITTED', 'APPROVED', 'REJECTED', 'SCHEDULED', 'RELEASED'] } };
    } else if (user.role === 'EXAM_OFFICER') {
      query = { status: { $in: ['APPROVED', 'SCHEDULED', 'RELEASED'] } };
    } else if (user.role === 'ADMIN') {
      query = {}; // Admin sees all
    }

    // Exclude raw encrypted content from listing to optimize bandwidth & enforce security
    const papers = await QuestionPaper.find(query)
      .select('-content')
      .sort({ updatedAt: -1 });

    return NextResponse.json({ success: true, papers });
  } catch (error: any) {
    console.error('List papers error:', error);
    return NextResponse.json({ error: 'Failed to fetch question papers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Please login' }, { status: 401 });
    }

    // RBAC: Only Question Setters and Admin can create question papers
    if (!hasRequiredRole(user, ['QUESTION_SETTER', 'ADMIN'])) {
      return NextResponse.json({ error: 'Forbidden: Only Question Setters can create papers' }, { status: 403 });
    }

    const { title, subject, examName, examDate, content, submitForReview } = await request.json();

    if (!title || !subject || !examName || !examDate || !content) {
      return NextResponse.json({ error: 'All fields including content are required' }, { status: 400 });
    }

    await connectToDatabase();

    // Step 7: Integrity - Generate SHA-256 Hash of original content
    const integrityHash = generateSHA256(content);

    // Step 4: Confidentiality - Encrypt content using AES-256-GCM
    const encryptedContent = encryptContent(content);

    const initialStatus = submitForReview ? 'SUBMITTED' : 'DRAFT';

    const newPaper = await QuestionPaper.create({
      title,
      subject,
      examName,
      examDate,
      content: encryptedContent,
      integrityHash,
      status: initialStatus,
      createdBy: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

    const action = submitForReview ? 'SUBMIT_QUESTION_PAPER' : 'CREATE_QUESTION_PAPER';
    await logAuditEvent({
      userId: user.id,
      userName: user.name,
      action,
      resource: 'QUESTION_PAPER',
      resourceId: newPaper._id.toString(),
      details: `Created "${title}" (${subject}) with status ${initialStatus}. SHA-256: ${integrityHash.substring(0, 16)}...`,
    });

    return NextResponse.json({
      success: true,
      paperId: newPaper._id,
      message: submitForReview ? 'Question paper submitted for review' : 'Question paper draft saved',
    });
  } catch (error: any) {
    console.error('Create paper error:', error);
    return NextResponse.json({ error: 'Failed to create question paper' }, { status: 500 });
  }
}
