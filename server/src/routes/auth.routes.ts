/**
 * auth.routes.ts — Express router for /api/v1/auth
 *
 * Route order:
 *   POST /register  → validate body → create user + return JWT
 *   POST /login     → validate body → verify credentials + return JWT
 *   GET  /me        → verify JWT    → return current user profile
 */
import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { registerSchema, loginSchema } from '../schemas/auth.schema';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), authController.register);
authRouter.post('/login', validate(loginSchema), authController.login);
authRouter.get('/me', authMiddleware, authController.getMe);
