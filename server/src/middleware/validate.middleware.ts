/**
 * validate.middleware.ts — Zod request validation middleware factory.
 *
 * Usage:
 *   router.post('/register', validate(registerSchema), authController.register);
 *
 * The schema is expected to validate an object with optional keys:
 *   { body, query, params }
 *
 * On success the parsed (and coerced) values are written back to req.body,
 * req.query, and req.params so downstream handlers receive clean typed data.
 * On failure the ZodError is forwarded to the central error handler which
 * formats it into a consistent 400 response.
 */
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Write coerced values back so TypeScript-typed handlers get clean data
      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) req.query = parsed.query;
      if (parsed.params !== undefined) req.params = parsed.params;

      next();
    } catch (err) {
      // Pass ZodError to central error handler
      next(err);
    }
  };
}
