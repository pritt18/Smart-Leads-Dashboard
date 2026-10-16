/**
 * env.ts — Load and validate required environment variables at startup.
 *
 * Importing this module early (before any other server code) ensures the
 * process exits with a clear error rather than crashing later with a
 * cryptic "undefined" reference if a required variable is missing.
 */
import dotenv from 'dotenv';
import path from 'path';

// Load .env file relative to the server package root (one level up from src/)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function requireEnvMinLength(name: string, minLength: number): string {
  const value = requireEnv(name);
  if (value.length < minLength) {
    throw new Error(
      `Environment variable ${name} must be at least ${minLength} characters long.`
    );
  }
  return value;
}

export const env = {
  PORT: parseInt(process.env['PORT'] ?? '5000', 10),
  NODE_ENV: process.env['NODE_ENV'] ?? 'development',
  MONGODB_URI: requireEnv('MONGODB_URI'),
  // Enforce a minimum 32-char secret so JWTs cannot be trivially brute-forced
  JWT_SECRET: requireEnvMinLength('JWT_SECRET', 32),
  JWT_EXPIRES_IN: process.env['JWT_EXPIRES_IN'] ?? '24h',
  CLIENT_ORIGIN: process.env['CLIENT_ORIGIN'] ?? 'http://localhost:5173',
} as const;
