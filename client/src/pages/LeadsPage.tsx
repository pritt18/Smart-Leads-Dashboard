/**
 * LeadsPage.tsx — Full-featured leads management page.
 *
 * Features:
 *  - Debounced full-text search (400ms)
 *  - Status and source filter dropdowns
 *  - Sortable column headers (click to toggle asc/desc)
 *  - Pagination with page-size selector (10 / 25 / 50)
 *  - Create / edit lead modal
 *  - Delete confirmation modal
 *  - CSV export button (respects active filters)
 *  - Loading skeletons, empty state, error banner
 *  - Responsive: table on tablet+, card list on mobile
 *
 * State is kept in this component rather than a separate hook because all
 * state directly drives the UI — there is no complex derived computation
 * that would benefit from extraction.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { listLeads, exportLeadsCSV } from '../api/leads.api';
import type { Lead, ListLeadsParams, SortField, SortOrder } from '../types/lead.types';
import { LEAD_STATUSES, LEAD_SOURCES } from '../types/lead.types';
import { formatCurrency, formatDate, extractErrorMessage } from '../utils/formatters';
import { useDebounce } from '../hooks/useDebounce';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { SkeletonRow } from '../components/common/Skeleton';
import { AlertBanner } from '../components/common/AlertBanner';
import { LeadForm } from '../components/leads/LeadForm';
import { DeleteConfirmModal } from '../components/leads/DeleteConfirmModal';

// ── Sort icon ─────────────────────────────────────────────────────────────────

function SortIcon({ field, sortBy, sortOrder }: { field: SortField; sortBy: SortField; sortOrder: SortOrder }) {
  if (sortBy !== field) {
    return (
      <svg className="ml-1 inline h-3.5 w-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
  }
  return sortOrder === 'asc' ? (
    <svg className="ml-1 inline h-3.5 w-3.5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  ) : (
    <svg className="ml-1 inline h-3.5 w-3.5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ── Mobile lead card ──────────────────────────────────────────────────────────

function LeadCard({
  lead,
  onEdit,
  onDelete,
}: {
  lead: Lead;
  onEdit: (l: Lead) => void;
  onDelete: (l: Lead) => void;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900">{lead.company}</p>
          <p className="text-sm text-gray-500">{lead.contactName}</p>
        </div>
        <Badge status={lead.status} />
      </div>
      <div className="mb-3 space-y-1 text-xs text-gray-500">
        <p>{lead.email}</p>
        {lead.phone && <p>{lead.phone}</p>}
        <p className="font-medium text-gray-700">{formatCurrency(lead.value)}</p>
        <p>Source: {lead.source}</p>
        <p>Added: {formatDate(lead.createdAt)}</p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => onEdit(lead)} className="flex-1">
          Edit
        </Button>
        <Button size="sm" variant="danger" onClick={() => onDelete(lead)} className="flex-1">
          Delete
        </Button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const LIMIT_OPTIONS = [
  { value: '10', label: '10 / page' },
  { value: '25', label: '25 / page' },
  { value: '50', label: '50 / page' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...LEAD_STATUSES.map((s) => ({ value: s, label: s })),
];

const SOURCE_OPTIONS = [
  { value: '', label: 'All sources' },
  ...LEAD_SOURCES.map((s) => ({ value: s, label: s })),
];

const TABLE_COLUMNS: { label: string; field?: SortField; className?: string }[] = [
  { label: 'Company', field: 'company' },
  { label: 'Contact', className: 'hidden sm:table-cell' },
  { label: 'Status', field: 'status', className: 'hidden md:table-cell' },
  { label: 'Source', className: 'hidden lg:table-cell' },
  { label: 'Value', field: 'value', className: 'hidden sm:table-cell' },
  { label: 'Added', field: 'createdAt', className: 'hidden xl:table-cell' },
  { label: 'Actions', className: 'text-right' },
];

export default function LeadsPage() {
  const { showToast } = useToast();

  // ── Filter / sort / pagination state ────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // ── Data state ───────────────────────────────────────────────────────────
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);   // true only on first fetch
  const [isFetching, setIsFetching] = useState(false); // refetch without full skeleton
  const [error, setError] = useState<string | null>(null);
  // Track whether the very first fetch has completed so we show the skeleton
  // on mount but the subtle spinner on subsequent filter/page changes.
  const initialFetchDone = useRef(false);

  // ── Modal state ──────────────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>(undefined);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchLeads = useCallback(
    async () => {
      // Show full skeleton only on the very first load; use the subtle
      // isFetching indicator for all subsequent fetches.
      if (!initialFetchDone.current) {
        setIsLoading(true);
      } else {
        setIsFetching(true);
      }
      setError(null);
      try {
        const params: ListLeadsParams = {
          page,
          limit,
          search: debouncedSearch || undefined,
          status: statusFilter as ListLeadsParams['status'] || undefined,
          source: sourceFilter as ListLeadsParams['source'] || undefined,
          sortBy,
          sortOrder,
        };
        const result = await listLeads(params);
        setLeads(result.leads);
        setTotalLeads(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setIsLoading(false);
        setIsFetching(false);
        initialFetchDone.current = true;
      }
    },
    [page, limit, debouncedSearch, statusFilter, sourceFilter, sortBy, sortOrder]
  );

  // Reset to page 1 whenever filters change (but not when page itself changes)
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, sourceFilter, sortBy, sortOrder, limit]);

  useEffect(() => {
    void fetchLeads();
  }, [fetchLeads]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleSort(field: SortField) {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  }

  function handleOpenCreate() {
    setEditingLead(undefined);
    setFormOpen(true);
  }

  function handleOpenEdit(lead: Lead) {
    setEditingLead(lead);
    setFormOpen(true);
  }

  function handleFormSuccess(_saved: Lead) {
    setFormOpen(false);
    const isNew = !editingLead;
    showToast(
      isNew ? 'Lead created successfully.' : 'Lead updated successfully.',
      'success'
    );
    void fetchLeads();
  }

  function handleDeleteSuccess(deletedId: string) {
    setDeletingLead(null);
    showToast('Lead deleted successfully.', 'success');
    setLeads((prev) => prev.filter((l) => l._id !== deletedId));
    setTotalLeads((prev) => prev - 1);
    // Go back a page if we just deleted the last item on this page
    if (leads.length === 1 && page > 1) setPage((p) => p - 1);
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      await exportLeadsCSV({
        search: debouncedSearch || undefined,
        status: statusFilter as ListLeadsParams['status'] || undefined,
        source: sourceFilter as ListLeadsParams['source'] || undefined,
        sortBy,
        sortOrder,
      });
      showToast('CSV downloaded.', 'success');
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setIsExporting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const isEmpty = !isLoading && !error && leads.length === 0;
  const hasFilter = debouncedSearch || statusFilter || sourceFilter;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative sm:w-64">
            <Input
              placeholder="Search company or contact…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              leftAddon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>

          {/* Filters */}
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={STATUS_OPTIONS}
            className="sm:w-40"
          />
          <Select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            options={SOURCE_OPTIONS}
            className="sm:w-40"
          />
        </div>

        {/* Actions */}
        <div className="flex shrink-0 gap-2">
          <Button
            variant="secondary"
            size="sm"
            isLoading={isExporting}
            onClick={() => void handleExport()}
            leftIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            }
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            New lead
          </Button>
        </div>
      </div>

      {/* ── Error banner ────────────────────────────────────────────────── */}
      {error && (
        <div className="space-y-2">
          <AlertBanner message={error} />
          <Button variant="secondary" size="sm" onClick={() => void fetchLeads()}>
            Retry
          </Button>
        </div>
      )}

      {/* ── Summary line ────────────────────────────────────────────────── */}
      {!isLoading && !error && (
        <p className="text-sm text-gray-500">
          {totalLeads === 0
            ? 'No leads found'
            : `${totalLeads} lead${totalLeads !== 1 ? 's' : ''}`}
          {hasFilter ? ' matching current filters' : ''}
          {isFetching && (
            <span className="ml-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-400 border-t-transparent align-middle" />
          )}
        </p>
      )}

      {/* ── Desktop table ────────────────────────────────────────────────── */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {TABLE_COLUMNS.map((col) => (
                <th
                  key={col.label}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 ${col.className ?? ''}`}
                >
                  {col.field ? (
                    <button
                      onClick={() => handleSort(col.field!)}
                      className="inline-flex items-center hover:text-gray-900 focus-visible:outline-none"
                    >
                      {col.label}
                      <SortIcon field={col.field} sortBy={sortBy} sortOrder={sortOrder} />
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
              : leads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{lead.company}</p>
                      <p className="text-xs text-gray-400">{lead.email}</p>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      {lead.contactName}
                      {lead.phone && (
                        <p className="text-xs text-gray-400">{lead.phone}</p>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <Badge status={lead.status} />
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 lg:table-cell">
                      {lead.source}
                    </td>
                    <td className="hidden px-4 py-3 font-medium text-gray-700 sm:table-cell">
                      {formatCurrency(lead.value)}
                    </td>
                    <td className="hidden px-4 py-3 text-gray-500 xl:table-cell">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEdit(lead)}
                          aria-label={`Edit ${lead.company}`}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeletingLead(lead)}
                          className="text-red-500 hover:bg-red-50"
                          aria-label={`Delete ${lead.company}`}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {/* Empty state inside table */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="mb-4 h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {hasFilter ? (
              <>
                <p className="font-medium text-gray-900">No leads match your filters</p>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                  onClick={() => { setSearchInput(''); setStatusFilter(''); setSourceFilter(''); }}
                >
                  Clear filters
                </Button>
              </>
            ) : (
              <>
                <p className="font-medium text-gray-900">No leads yet</p>
                <p className="mt-1 text-sm text-gray-500">Create your first lead to get started.</p>
                <Button variant="primary" size="sm" className="mt-4" onClick={handleOpenCreate}>
                  New lead
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Mobile card list ─────────────────────────────────────────────── */}
      <div className="space-y-3 sm:hidden">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm space-y-2">
                <div className="skeleton h-4 w-32" />
                <div className="skeleton h-3 w-48" />
                <div className="skeleton h-3 w-24" />
              </div>
            ))
          : leads.map((lead) => (
              <LeadCard
                key={lead._id}
                lead={lead}
                onEdit={handleOpenEdit}
                onDelete={setDeletingLead}
              />
            ))}
        {isEmpty && (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center">
            <p className="font-medium text-gray-900">
              {hasFilter ? 'No leads match your filters' : 'No leads yet'}
            </p>
            {!hasFilter && (
              <Button variant="primary" size="sm" className="mt-4" onClick={handleOpenCreate}>
                New lead
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Rows per page</span>
            <Select
              value={String(limit)}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              options={LIMIT_OPTIONS}
              className="w-32"
            />
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(1)}
              aria-label="First page"
            >
              «
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Previous page"
            >
              ‹
            </Button>
            <span className="px-3 text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Next page"
            >
              ›
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
              aria-label="Last page"
            >
              »
            </Button>
          </div>
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <LeadForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
        initialValues={editingLead}
      />
      <DeleteConfirmModal
        lead={deletingLead}
        onClose={() => setDeletingLead(null)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
