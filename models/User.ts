import mongoose, { Schema, Document, Model } from 'mongoose';
import { Role } from '@/lib/auth';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Please provide user name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide password hash'],
    },
    role: {
      type: String,
      enum: ['ADMIN', 'QUESTION_SETTER', 'REVIEWER', 'EXAM_OFFICER'],
      default: 'QUESTION_SETTER',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
