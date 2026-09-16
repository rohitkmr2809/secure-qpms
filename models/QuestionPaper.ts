import mongoose, { Schema, Document, Model } from 'mongoose';

export type PaperStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'SCHEDULED' | 'RELEASED';

export interface IQuestionPaper extends Document {
  title: string;
  subject: string;
  examName: string;
  examDate: string;
  content: string; // Encrypted using AES-256-GCM
  status: PaperStatus;
  integrityHash: string; // SHA-256 hash of original plain text
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  reviewedBy?: {
    id: string;
    name: string;
    email: string;
  };
  reviewedAt?: Date;
  reviewRemarks?: string;
  releaseTime?: Date;
  releasedBy?: {
    id: string;
    name: string;
    email: string;
  };
  releasedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionPaperSchema = new Schema<IQuestionPaper>(
  {
    title: {
      type: String,
      required: [true, 'Question paper title is required'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    examName: {
      type: String,
      required: [true, 'Exam Name is required'],
      trim: true,
    },
    examDate: {
      type: String,
      required: [true, 'Exam Date is required'],
    },
    content: {
      type: String,
      required: [true, 'Question paper content is required'],
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'SCHEDULED', 'RELEASED'],
      default: 'DRAFT',
      required: true,
    },
    integrityHash: {
      type: String,
      required: [true, 'Cryptographic integrity hash is required'],
    },
    createdBy: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      email: { type: String, required: true },
    },
    reviewedBy: {
      id: String,
      name: String,
      email: String,
    },
    reviewedAt: Date,
    reviewRemarks: String,
    releaseTime: Date,
    releasedBy: {
      id: String,
      name: String,
      email: String,
    },
    releasedAt: Date,
  },
  {
    timestamps: true,
  }
);

const QuestionPaper: Model<IQuestionPaper> =
  mongoose.models.QuestionPaper || mongoose.model<IQuestionPaper>('QuestionPaper', QuestionPaperSchema);

export default QuestionPaper;
