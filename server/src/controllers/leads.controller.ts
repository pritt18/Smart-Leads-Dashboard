/**
 * leads.controller.ts — HTTP handlers for lead routes.
 *
 * Thin layer: extract validated request data → call service → format response.
 * req.user is always present because every route is behind authMiddleware.
 */
import { Request, Response, NextFunction } from 'express';
import * as leadsService from '../services/leads.service';
import type { CreateLeadInput, UpdateLeadInput, ListLeadsQuery } from '../schemas/lead.schema';

export const leadsController = {
  // ── GET /leads ────────────────────────────────────────────────────────────
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as ListLeadsQuery;
      const result = await leadsService.listLeads(req.user!.userId, query);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  // ── POST /leads ───────────────────────────────────────────────────────────
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateLeadInput;
      const lead = await leadsService.createLead(req.user!.userId, input);
      res.status(201).json({ success: true, data: { lead } });
    } catch (err) {
      next(err);
    }
  },

  // ── GET /leads/metrics ────────────────────────────────────────────────────
  async metrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await leadsService.getMetrics(req.user!.userId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  // ── GET /leads/export/csv ─────────────────────────────────────────────────
  async exportCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as ListLeadsQuery;
      const leads = await leadsService.getLeadsForExport(req.user!.userId, query);
      const csv = leadsService.leadsToCSV(leads);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `leads-${timestamp}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  },

  // ── GET /leads/:id ────────────────────────────────────────────────────────
  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lead = await leadsService.getLeadById(req.user!.userId, req.params['id']!);
      res.status(200).json({ success: true, data: { lead } });
    } catch (err) {
      next(err);
    }
  },

  // ── PATCH /leads/:id ──────────────────────────────────────────────────────
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as UpdateLeadInput;
      const lead = await leadsService.updateLead(req.user!.userId, req.params['id']!, input);
      res.status(200).json({ success: true, data: { lead } });
    } catch (err) {
      next(err);
    }
  },

  // ── DELETE /leads/:id ─────────────────────────────────────────────────────
  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await leadsService.deleteLead(req.user!.userId, req.params['id']!);
      res.status(200).json({ success: true, data: { message: 'Lead deleted successfully.' } });
    } catch (err) {
      next(err);
    }
  },
};
