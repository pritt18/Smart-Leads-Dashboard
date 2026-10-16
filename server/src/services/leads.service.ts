/**
 * leads.service.ts — Business logic for lead CRUD, search, filtering,
 * sorting, pagination, metrics aggregation, and CSV generation.
 *
 * All functions accept a `userId` argument and embed it in every query.
 * This is the primary ownership enforcement layer — even if a route somehow
 * received the wrong id, the query would simply return nothing.
 *
 * Search implementation notes:
 *  - When a `search` string is provided we use MongoDB's $text operator
 *    against the compound text index on (company, contactName).
 *  - When no search string is present we use a standard filter query which
 *    hits the compound { userId, createdAt } or { userId, status } indexes.
 *  - Text search and arbitrary sort cannot be combined in MongoDB (text search
 *    always scores by relevance). When a search term is active we sort by
 *    text score instead of honoring the caller's sortBy/sortOrder.
 */
import mongoose from 'mongoose';
import { Lead, ILead, LEAD_STATUSES } from '../models/Lead.model';
import { AppError } from '../middleware/error.middleware';
import type { CreateLeadInput, UpdateLeadInput, ListLeadsQuery } from '../schemas/lead.schema';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaginatedLeads {
  leads: ILead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LeadMetrics {
  totalLeads: number;
  byStatus: Record<string, number>;
  thisMonth: number;
  conversionRate: number;
  totalValue: number;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function createLead(
  userId: string,
  input: CreateLeadInput
): Promise<ILead> {
  const lead = await Lead.create({ ...input, userId });
  return lead;
}

export async function getLeadById(
  userId: string,
  leadId: string
): Promise<ILead> {
  const lead = await Lead.findOne({
    _id: leadId,
    userId,
  });
  if (!lead) {
    throw new AppError('Lead not found.', 404);
  }
  return lead;
}

export async function updateLead(
  userId: string,
  leadId: string,
  input: UpdateLeadInput
): Promise<ILead> {
  const lead = await Lead.findOneAndUpdate(
    { _id: leadId, userId },
    { $set: input },
    { new: true, runValidators: true }
  );
  if (!lead) {
    throw new AppError('Lead not found.', 404);
  }
  return lead;
}

export async function deleteLead(
  userId: string,
  leadId: string
): Promise<void> {
  const result = await Lead.deleteOne({ _id: leadId, userId });
  if (result.deletedCount === 0) {
    throw new AppError('Lead not found.', 404);
  }
}

// ─── List with search / filter / sort / pagination ───────────────────────────

export async function listLeads(
  userId: string,
  query: ListLeadsQuery
): Promise<PaginatedLeads> {
  const { page, limit, search, status, source, sortBy, sortOrder } = query;
  const skip = (page - 1) * limit;

  // Base filter — always scoped to the authenticated user
  const filter: mongoose.FilterQuery<ILead> = { userId };

  if (status) filter['status'] = status;
  if (source) filter['source'] = source;

  let mongoQuery;
  let sortOption: Record<string, 1 | -1 | { $meta: 'textScore' }>;

  if (search && search.trim().length > 0) {
    // Full-text search path: add $text operator and sort by relevance score.
    // We cannot combine $text with an arbitrary sort field in MongoDB.
    filter['$text'] = { $search: search.trim() };
    sortOption = { score: { $meta: 'textScore' } };

    mongoQuery = Lead.find(filter, { score: { $meta: 'textScore' } });
  } else {
    // Standard query path: sort by the requested column
    const order = sortOrder === 'asc' ? 1 : -1;
    sortOption = { [sortBy]: order };

    mongoQuery = Lead.find(filter);
  }

  // Run count and paginated fetch in parallel for performance
  const [total, leads] = await Promise.all([
    Lead.countDocuments(filter),
    mongoQuery
      .sort(sortOption as Parameters<typeof mongoQuery.sort>[0])
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return {
    leads,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ─── CSV export ───────────────────────────────────────────────────────────────

/** Maximum rows returned by the CSV export to prevent memory exhaustion. */
export const CSV_EXPORT_LIMIT = 10_000;

/**
 * Fetch leads matching a filter set (no pagination) for CSV export.
 * Capped at CSV_EXPORT_LIMIT rows to prevent unbounded memory use on
 * accounts with very large datasets.
 */
export async function getLeadsForExport(
  userId: string,
  query: Omit<ListLeadsQuery, 'page' | 'limit'>
): Promise<ILead[]> {
  const { search, status, source, sortBy, sortOrder } = query;

  const filter: mongoose.FilterQuery<ILead> = { userId };
  if (status) filter['status'] = status;
  if (source) filter['source'] = source;

  let mongoQuery;
  let sortOption: Record<string, 1 | -1 | { $meta: 'textScore' }>;

  if (search && search.trim().length > 0) {
    filter['$text'] = { $search: search.trim() };
    sortOption = { score: { $meta: 'textScore' } };
    mongoQuery = Lead.find(filter, { score: { $meta: 'textScore' } });
  } else {
    const order = sortOrder === 'asc' ? 1 : -1;
    sortOption = { [sortBy]: order };
    mongoQuery = Lead.find(filter);
  }

  return mongoQuery
    .sort(sortOption as Parameters<typeof mongoQuery.sort>[0])
    .limit(CSV_EXPORT_LIMIT)
    .lean();
}

/**
 * Convert an array of lead documents into a CSV string.
 *
 * Uses manual string building rather than a CSV library to keep dependencies
 * minimal. Values are quoted and internal double-quotes are escaped per RFC 4180.
 */
export function leadsToCSV(leads: ILead[]): string {
  const headers = [
    'ID',
    'Company',
    'Contact Name',
    'Email',
    'Phone',
    'Status',
    'Source',
    'Value',
    'Notes',
    'Expected Close Date',
    'Created At',
    'Updated At',
  ];

  function csvEscape(value: unknown): string {
    if (value === undefined || value === null) return '';
    const str = String(value).replace(/"/g, '""'); // Escape internal quotes
    // Wrap in quotes if the value contains commas, quotes, or newlines
    return /[",\n\r]/.test(str) ? `"${str}"` : str;
  }

  const rows = leads.map((lead) => {
    const l = lead as ILead & { _id: mongoose.Types.ObjectId };
    return [
      csvEscape(l._id?.toString()),
      csvEscape(l.company),
      csvEscape(l.contactName),
      csvEscape(l.email),
      csvEscape(l.phone),
      csvEscape(l.status),
      csvEscape(l.source),
      csvEscape(l.value),
      csvEscape(l.notes),
      csvEscape(l.expectedCloseDate?.toISOString()),
      csvEscape(l.createdAt?.toISOString()),
      csvEscape(l.updatedAt?.toISOString()),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

// ─── Dashboard metrics ────────────────────────────────────────────────────────

/**
 * Compute dashboard metrics using a single MongoDB aggregation pipeline.
 *
 * Pipeline stages:
 *  1. $match   — scope to the authenticated user
 *  2. $facet   — run multiple sub-pipelines in one round-trip:
 *     a. statusCounts: group by status
 *     b. totalValue: sum all values
 *     c. thisMonth: count leads created in current calendar month
 */
export async function getMetrics(userId: string): Promise<LeadMetrics> {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Start of current calendar month (UTC)
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [result] = await Lead.aggregate<{
    statusCounts: { _id: string; count: number }[];
    totals: { totalValue: number; totalLeads: number }[];
    thisMonth: { count: number }[];
  }>([
    { $match: { userId: userObjectId } },
    {
      $facet: {
        statusCounts: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        totals: [
          {
            $group: {
              _id: null,
              totalValue: { $sum: '$value' },
              totalLeads: { $sum: 1 },
            },
          },
        ],
        thisMonth: [
          { $match: { createdAt: { $gte: startOfMonth } } },
          { $count: 'count' },
        ],
      },
    },
  ]);

  // Build byStatus map initialised to 0 for all known statuses
  const byStatus: Record<string, number> = Object.fromEntries(
    LEAD_STATUSES.map((s) => [s, 0])
  );
  for (const { _id, count } of result.statusCounts) {
    byStatus[_id] = count;
  }

  const totalLeads = result.totals[0]?.totalLeads ?? 0;
  const totalValue = result.totals[0]?.totalValue ?? 0;
  const thisMonth = result.thisMonth[0]?.count ?? 0;

  const won = byStatus['Won'] ?? 0;
  const lost = byStatus['Lost'] ?? 0;
  const closedTotal = won + lost;
  const conversionRate =
    closedTotal > 0 ? Math.round((won / closedTotal) * 1000) / 10 : 0;

  return { totalLeads, byStatus, thisMonth, conversionRate, totalValue };
}
