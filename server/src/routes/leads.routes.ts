/**
 * leads.routes.ts — Express router for /api/v1/leads
 *
 * All routes are protected by authMiddleware.
 *
 * IMPORTANT: Static path segments (/metrics, /export/csv) must be registered
 * BEFORE the parameterised route (/:id) so Express matches them first.
 * Without this ordering, a request to /metrics would be captured by /:id
 * with id = "metrics" and result in a CastError or 404.
 *
 * Route table:
 *   GET    /               → list (search, filter, sort, paginate)
 *   POST   /               → create
 *   GET    /metrics        → dashboard metrics  ← BEFORE /:id
 *   GET    /export/csv     → CSV export         ← BEFORE /:id
 *   GET    /:id            → get single lead
 *   PATCH  /:id            → partial update
 *   DELETE /:id            → delete
 */
import { Router } from 'express';
import { leadsController } from '../controllers/leads.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createLeadSchema,
  updateLeadSchema,
  listLeadsSchema,
} from '../schemas/lead.schema';

export const leadsRouter = Router();

// All leads routes require authentication
leadsRouter.use(authMiddleware);

// ── Collection routes ────────────────────────────────────────────────────────
leadsRouter.get('/', validate(listLeadsSchema), leadsController.list);
leadsRouter.post('/', validate(createLeadSchema), leadsController.create);

// ── Static sub-routes (must be before /:id) ──────────────────────────────────
leadsRouter.get('/metrics', leadsController.metrics);
leadsRouter.get('/export/csv', validate(listLeadsSchema), leadsController.exportCSV);

// ── Single-resource routes ───────────────────────────────────────────────────
leadsRouter.get('/:id', leadsController.getOne);
leadsRouter.patch('/:id', validate(updateLeadSchema), leadsController.update);
leadsRouter.delete('/:id', leadsController.remove);
