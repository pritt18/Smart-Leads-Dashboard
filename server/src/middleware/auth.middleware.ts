/**
 * auth.middleware.ts — JWT verification middleware.
 *
 * Reads the Authorization header, verifies the token's signature and expiry,
 * then attaches { userId, email } to req.user for downstream handlers.
 *
 * Throws AppError 401 on any failure (missing, malformed, expired).
 * Using a single generic "Unauthorized" message for expired tokens prevents
 * leaking information about whether a token exists but is expired vs. never
 * existed at all.
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './error.middleware';

interface JwtPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Please log in.', 401);
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
      return;
    }
    // jwt.verify throws JsonWebTokenError / TokenExpiredError
    next(new AppError('Authentication required. Please log in.', 401));
  }
}
