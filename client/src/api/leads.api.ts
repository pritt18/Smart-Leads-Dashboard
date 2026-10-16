/**
 * leads.api.ts — Typed API functions for lead endpoints.
 *
 * All functions return unwrapped data. Callers receive Lead objects and
 * pagination metadata directly, not the { success, data } envelope.
 *
 * The export function requests the same filtered set as the list endpoint
 * but hits /export/csv, receiving a Blob that the browser downloads directly.
 */
import axiosInstance from './axiosInstance';
import type {
  Lead,
  PaginatedLeads,
  LeadMetrics,
  ListLeadsParams,
  CreateLeadPayload,
  UpdateLeadPayload,
} from '../types/lead.types';
import type { ApiSuccess } from '../types/api.types';

// ── List ─────────────────────────────────────────────────────────────────────

export async function listLeads(params: ListLeadsParams): Promise<PaginatedLeads> {
  // Strip empty string values so they are not sent as query params
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined)
  );
  const res = await axiosInstance.get<ApiSuccess<PaginatedLeads>>('/api/v1/leads', {
    params: clean,
  });
  return res.data.data;
}

// ── Single ───────────────────────────────────────────────────────────────────

export async function getLead(id: string): Promise<Lead> {
  const res = await axiosInstance.get<ApiSuccess<{ lead: Lead }>>(`/api/v1/leads/${id}`);
  return res.data.data.lead;
}

// ── Create ───────────────────────────────────────────────────────────────────

export async function createLead(payload: CreateLeadPayload): Promise<Lead> {
  const res = await axiosInstance.post<ApiSuccess<{ lead: Lead }>>(
    '/api/v1/leads',
    payload
  );
  return res.data.data.lead;
}

// ── Update ───────────────────────────────────────────────────────────────────

export async function updateLead(id: string, payload: UpdateLeadPayload): Promise<Lead> {
  const res = await axiosInstance.patch<ApiSuccess<{ lead: Lead }>>(
    `/api/v1/leads/${id}`,
    payload
  );
  return res.data.data.lead;
}

// ── Delete ───────────────────────────────────────────────────────────────────

export async function deleteLead(id: string): Promise<void> {
  await axiosInstance.delete(`/api/v1/leads/${id}`);
}

// ── Metrics ──────────────────────────────────────────────────────────────────

export async function getMetrics(): Promise<LeadMetrics> {
  const res = await axiosInstance.get<ApiSuccess<LeadMetrics>>('/api/v1/leads/metrics');
  return res.data.data;
}

// ── CSV export ────────────────────────────────────────────────────────────────

/**
 * Requests the CSV blob and triggers a browser download.
 * The filename is taken from the Content-Disposition header when available,
 * falling back to a timestamped default.
 */
export async function exportLeadsCSV(params: Omit<ListLeadsParams, 'page' | 'limit'>): Promise<void> {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined)
  );

  const res = await axiosInstance.get('/api/v1/leads/export/csv', {
    params: clean,
    responseType: 'blob',
  });

  // Extract filename from Content-Disposition header if present
  const disposition = res.headers['content-disposition'] as string | undefined;
  let filename = `leads-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
  if (disposition) {
    const match = /filename="?([^";\n]+)"?/.exec(disposition);
    if (match?.[1]) filename = match[1];
  }

  // Create a temporary anchor and click it to trigger the download
  const url = URL.createObjectURL(new Blob([res.data as BlobPart], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
