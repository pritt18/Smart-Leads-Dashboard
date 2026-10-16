/**
 * lead.types.ts — TypeScript interfaces for lead data.
 * Enum arrays are defined as const so they can drive both TypeScript
 * types and runtime dropdowns from a single source of truth.
 */

export const LEAD_STATUSES = [
  'New',
  'Contacted',
  'Qualified',
  'Proposal',
  'Won',
  'Lost',
] as const;

export const LEAD_SOURCES = [
  'Website',
  'Referral',
  'Cold Call',
  'LinkedIn',
  'Event',
  'Other',
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const SORTABLE_FIELDS = [
  'createdAt',
  'updatedAt',
  'value',
  'company',
  'status',
] as const;

export type SortField = (typeof SORTABLE_FIELDS)[number];
export type SortOrder = 'asc' | 'desc';

export interface Lead {
  _id: string;
  userId: string;
  company: string;
  contactName: string;
  email: string;
  phone?: string;
  status: LeadStatus;
  source: LeadSource;
  value: number;
  notes?: string;
  expectedCloseDate?: string;
  createdAt: string;
  updatedAt: string;
}

/** Fields sent when creating a new lead */
export interface CreateLeadPayload {
  company: string;
  contactName: string;
  email: string;
  phone?: string;
  status: LeadStatus;
  source: LeadSource;
  value: number;
  notes?: string;
  expectedCloseDate?: string;
}

/** All fields optional for PATCH */
export type UpdateLeadPayload = Partial<CreateLeadPayload>;

/** Query parameters for GET /leads */
export interface ListLeadsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: LeadStatus | '';
  source?: LeadSource | '';
  sortBy?: SortField;
  sortOrder?: SortOrder;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedLeads {
  leads: Lead[];
  pagination: Pagination;
}

export interface LeadMetrics {
  totalLeads: number;
  byStatus: Record<LeadStatus, number>;
  thisMonth: number;
  conversionRate: number;
  totalValue: number;
}
