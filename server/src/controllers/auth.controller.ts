/**
 * auth.controller.ts — HTTP handlers for authentication routes.
 *
 * Controllers are thin: they extract validated data from the request,
 * delegate to the service, and format the HTTP response. No business logic
 * or DB queries live here.
 *
 * All async handlers are wrapped with a try/catch that forwards errors to
 * the central error middleware via next(err). This avoids wrapping every
 * handler in asyncHandler utility — the pattern is explicit and readable.
 */
import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import type { RegisterInput, LoginInput } from '../schemas/auth.schema';

export const authController = {
  /**
   * POST /api/v1/auth/register
   * Body validated by registerSchema via validate() middleware.
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as RegisterInput;
      const result = await authService.registerUser(input);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/auth/login
   * Body validated by loginSchema via validate() middleware.
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as LoginInput;
      const result = await authService.loginUser(input);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/auth/me
   * Protected route — req.user is guaranteed by authMiddleware.
   */
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // req.user is set by authMiddleware; the non-null assertion is safe here
      // because this route is always behind authMiddleware.
      const user = await authService.getMe(req.user!.userId);
      res.status(200).json({ success: true, data: { user } });
    } catch (err) {
      next(err);
    }
  },
};
