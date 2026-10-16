/**
 * app.ts — Express application factory.
 *
 * Deliberately does NOT call app.listen() so tests can import this module
 * without binding a port. server.ts is the sole entry point that starts
 * listening.
 */
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env } from './config/env';
import { authRouter } from './routes/auth.routes';
import { leadsRouter } from './routes/leads.routes';
import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/error.middleware';

const app = express();

// ─── Security headers ────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ────────────────────────────────────────────────────────────────────
// Allow only the configured client origin; no credentials via cookies so
// localStorage-based JWT is the sole auth mechanism.
const allowedOrigins = env.CLIENT_ORIGIN.split(',').map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., Postman, server-to-server)
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        (env.NODE_ENV === 'development' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
      ) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: origin ${origin} not allowed`));
      }
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Request logging ─────────────────────────────────────────────────────────
// Only log in non-test environments to keep test output clean.
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Body parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // Reject abnormally large bodies

// ─── Global rate limiting ────────────────────────────────────────────────────
// A broad limit for all API routes; auth routes get a tighter limit below.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Stricter limit specifically for authentication to slow brute-force attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});

app.use('/api', globalLimiter);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authLimiter, authRouter);
app.use('/api/v1/leads', leadsRouter);

// ─── Health check ────────────────────────────────────────────────────────────
// Deliberately omits NODE_ENV — no need to confirm environment to anonymous callers.
app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

// ─── 404 and centralised error handling ──────────────────────────────────────
// Order matters: notFoundHandler must come after all routes so unmatched
// requests fall through to it; errorHandler must be last because Express
// identifies error-handling middleware by its 4-parameter signature.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
