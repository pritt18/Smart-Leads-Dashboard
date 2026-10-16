/**
 * auth.service.ts — Business logic for user registration and login.
 *
 * This layer has no knowledge of HTTP (no Request/Response). Keeping it
 * decoupled means the service functions are easy to unit-test in isolation
 * and could be reused by a CLI, worker, or other transport in the future.
 *
 * bcrypt cost factor 12: ~250ms on a modern server, which is fast enough for
 * a good user experience but expensive enough to make brute-force impractical.
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserDocument } from '../models/User.model';
import { env } from '../config/env';
import { AppError } from '../middleware/error.middleware';
import type { RegisterInput, LoginInput } from '../schemas/auth.schema';

const BCRYPT_ROUNDS = 12;

// ─── Types returned by service functions ─────────────────────────────────────

export interface AuthResult {
  user: {
    _id: string;
    name: string;
    email: string;
    createdAt: Date;
  };
  token: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function signToken(user: UserDocument): string {
  return jwt.sign(
    { userId: user._id.toString(), email: user.email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  );
}

function sanitizeUser(user: UserDocument): AuthResult['user'] {
  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Register a new user.
 * Throws 409 if the email is already taken (Mongoose unique index also
 * enforces this at the DB level; the AppError is an early, friendlier check).
 */
export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw new AppError('An account with that email already exists.', 409);
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
  });

  return {
    user: sanitizeUser(user),
    token: signToken(user),
  };
}

/**
 * Log in an existing user.
 * Uses a constant-time bcrypt compare so timing attacks cannot distinguish
 * "email not found" from "wrong password" (both return the same 401).
 */
export async function loginUser(input: LoginInput): Promise<AuthResult> {
  // Explicitly select passwordHash since the schema hides it by default
  const user = await User.findOne({ email: input.email }).select('+passwordHash');

  // Perform the comparison even if user is null to prevent timing attacks
  const dummyHash = '$2a$12$invalidhashfortimingprotection00000000000000000000000';
  const passwordHash = user?.passwordHash ?? dummyHash;
  const isMatch = await bcrypt.compare(input.password, passwordHash);

  if (!user || !isMatch) {
    // Intentionally vague — don't reveal whether the email exists
    throw new AppError('Invalid email or password.', 401);
  }

  return {
    user: sanitizeUser(user),
    token: signToken(user),
  };
}

/**
 * Fetch the profile of the currently authenticated user.
 */
export async function getMe(userId: string): Promise<AuthResult['user']> {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found.', 404);
  }
  return sanitizeUser(user);
}
