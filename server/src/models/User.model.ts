/**
 * User.model.ts — Mongoose schema and model for application users.
 *
 * Design decisions:
 * - `passwordHash` uses `select: false` so it is never returned in queries
 *   unless explicitly requested with `.select('+passwordHash')`. This prevents
 *   accidental password exposure in API responses.
 * - The email index is defined on the schema (unique: true) rather than as a
 *   separate createIndex() call so Mongoose manages it alongside the schema.
 * - bcrypt comparison lives on the model as an instance method to keep hashing
 *   logic colocated with the User schema rather than scattered across services.
 */
import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// ─── TypeScript interfaces ───────────────────────────────────────────────────

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  /** Compare a plain-text password against the stored hash. */
  comparePassword(candidate: string): Promise<boolean>;
}

// The full document type combines fields + methods + Mongoose Document
export type UserDocument = Document<unknown, object, IUser> &
  IUser &
  IUserMethods & { _id: mongoose.Types.ObjectId };

type UserModel = Model<IUser, object, IUserMethods>;

// ─── Schema ──────────────────────────────────────────────────────────────────

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Never returned in query results by default
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    versionKey: false, // Remove __v from documents
  }
);

// ─── Instance methods ────────────────────────────────────────────────────────

userSchema.method(
  'comparePassword',
  async function (candidate: string): Promise<boolean> {
    return bcrypt.compare(candidate, this.passwordHash);
  }
);

// ─── Model ───────────────────────────────────────────────────────────────────

export const User = mongoose.model<IUser, UserModel>('User', userSchema);
