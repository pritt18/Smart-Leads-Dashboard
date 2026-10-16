/**
 * express.d.ts — Augment Express's Request interface so TypeScript knows
 * about the `user` property that our JWT middleware attaches after
 * verifying a token.
 *
 * This is a declaration-merging pattern — no runtime code lives here.
 */
import 'express';

declare module 'express' {
  interface Request {
    /**
     * Set by authMiddleware after a valid JWT is verified.
     * Undefined on public (unauthenticated) routes.
     */
    user?: {
      userId: string;
      email: string;
    };
  }
}
