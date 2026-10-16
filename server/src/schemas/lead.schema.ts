/**
 * lead.schema.ts — Zod schemas for lead request bodies and query parameters.
 *
 * Three schemas cover the full surface of the leads API:
 *  1. createLeadSchema   — POST /leads (all required fields)
 *  2. updateLeadSchema   — PATCH /leads/:id (all fields optional)
 *  3. listLeadsSchema    — GET /leads query string (search/filter/sort/page)
 *
 * The query schema coerces string query params to the correct types (numbers,
 * enums) so the service layer receives properly typed values without manual
 * parsing.
 */
import { z } from 'zod';
import { LEAD_STATUSES, LEAD_SOURCES } from '../models/Lead.model';

// ─── Reusable field definitions ──────────────────────────────────────────────

const statusEnum = z.enum(LEAD_STATUSES, {
  errorMap: () => ({ message: `Status must be one of: ${LEAD_STATUSES.join(', ')}` }),
});

const sourceEnum = z.enum(LEAD_SOURCES, {
  errorMap: () => ({ message: `Source must be one of: ${LEAD_SOURCES.join(', ')}` }),
});

// ─── Create ──────────────────────────────────────────────────────────────────

export const createLeadSchema = z.object({
  body: z.object({
    company: z
      .string({ required_error: 'Company name is required' })
      .trim()
      .min(1, 'Company name is required')
      .max(150, 'Company name cannot exceed 150 characters'),

    contactName: z
      .string({ required_error: 'Contact name is required' })
      .trim()
      .min(1, 'Contact name is required')
      .max(100, 'Contact name cannot exceed 100 characters'),

    email: z
      .string({ required_error: 'Contact email is required' })
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address'),

    phone: z.string().trim().max(30, 'Phone cannot exceed 30 characters').optional(),

    status: statusEnum.default('New'),

    source: sourceEnum.default('Other'),

    value: z
      .number({ invalid_type_error: 'Value must be a number' })
      .min(0, 'Value cannot be negative')
      .default(0),

    notes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional(),

    expectedCloseDate: z.coerce
      .date({ invalid_type_error: 'Expected close date must be a valid date' })
      .optional(),
  }),
});

// ─── Update (all fields optional, but at least one must be present) ──────────

export const updateLeadSchema = z.object({
  body: createLeadSchema.shape.body
    .partial()
    .refine(
      (data) => Object.keys(data).length > 0,
      { message: 'At least one field must be provided for an update.' }
    ),
});

// ─── List / query params ─────────────────────────────────────────────────────

// Allowed sort fields — only columns that have an index or are cheap to sort
const SORTABLE_FIELDS = ['createdAt', 'updatedAt', 'value', 'company', 'status'] as const;

export const listLeadsSchema = z.object({
  query: z.object({
    // Pagination
    page: z.coerce
      .number({ invalid_type_error: 'Page must be a number' })
      .int()
      .min(1, 'Page must be at least 1')
      .default(1),

    limit: z.coerce
      .number({ invalid_type_error: 'Limit must be a number' })
      .int()
      .min(1, 'Limit must be at least 1')
      .max(50, 'Limit cannot exceed 50')
      .default(10),

    // Full-text search
    search: z.string().trim().optional(),

    // Filters
    status: statusEnum.optional(),
    source: sourceEnum.optional(),

    // Sorting
    sortBy: z
      .enum(SORTABLE_FIELDS, {
        errorMap: () => ({ message: `sortBy must be one of: ${SORTABLE_FIELDS.join(', ')}` }),
      })
      .default('createdAt'),

    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

// ─── Inferred types ──────────────────────────────────────────────────────────

export type CreateLeadInput = z.infer<typeof createLeadSchema>['body'];
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>['body'];
export type ListLeadsQuery = z.infer<typeof listLeadsSchema>['query'];
