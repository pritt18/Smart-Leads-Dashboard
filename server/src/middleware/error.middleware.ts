/**
 * error.middleware.ts — Centralised error handling.
 *
 * Two exports:
 *  - notFoundHandler  : Catches requests that didn't match any route (404).
 *  - errorHandler     : The single place all thrown errors flow through.
 *
 * Error classification:
 *  - ZodError           → 400 with per-field validation messages
 *  - AppError           → uses the status code set at throw site
 *  - Mongoose 11000     → 409 (duplicate key, e.g. duplicate email)
 *  - Mongoose CastError → 400 (invalid ObjectId in URL param)
 *  - Everything else    → 500 (never leaks stack traces in production)
 */
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

// ─── Custom application error ────────────────────────────────────────────────

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Marks errors we explicitly throw (not bugs)
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── 404 handler ─────────────────────────────────────────────────────────────

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
}

// ─── Central error handler ───────────────────────────────────────────────────

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const isDev = process.env['NODE_ENV'] === 'development';

  // ── Zod validation error ──────────────────────────────────────────────────
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    res.status(400).json({ success: false, message: 'Validation failed', errors });
    return;
  }

  // ── Known operational error ───────────────────────────────────────────────
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }

  // ── Mongoose duplicate key (e.g., duplicate email on register) ────────────
  if (
    err instanceof mongoose.mongo.MongoServerError &&
    (err as mongoose.mongo.MongoServerError).code === 11000
  ) {
    const field = Object.keys(
      (err as mongoose.mongo.MongoServerError & { keyValue: Record<string, unknown> }).keyValue ?? {}
    )[0] ?? 'field';
    res.status(409).json({
      success: false,
      message: `An account with that ${field} already exists.`,
    });
    return;
  }

  // ── CORS policy violation ─────────────────────────────────────────────────
  // The cors package passes a plain Error (not AppError) when the origin
  // callback rejects. Detect it by message prefix to return 403 cleanly
  // instead of letting it fall through to the generic 500 handler.
  if (
    err instanceof Error &&
    err.message.startsWith('CORS policy:')
  ) {
    res.status(403).json({ success: false, message: err.message });
    return;
  }

  // ── Mongoose CastError (invalid ObjectId in route param) ─────────────────
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ success: false, message: `Invalid value for field: ${err.path}` });
    return;
  }

  // ── Unknown / programming error ───────────────────────────────────────────
  if (isDev) {
    console.error('Unhandled error:', err);
  }

  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred. Please try again later.',
    ...(isDev && { detail: err instanceof Error ? err.message : String(err) }),
  });
}
