/**
 * formatters.ts — Pure utility functions for display formatting.
 * No React imports — safe to call anywhere including tests.
 */

/** Format a number as USD currency, e.g. 4500 → "$4,500" */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

/** Format an ISO date string as a short date, e.g. "Jan 15, 2025" */
export function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso));
}

/** Format a percentage to one decimal place, e.g. 66.666 → "66.7%" */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Extract a human-readable error message from an Axios error or unknown value.
 * Falls back to a generic string so callers never need to check for undefined.
 */
export function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as { response?: { data?: { message?: string } } };
    if (axiosErr.response?.data?.message) {
      return axiosErr.response.data.message;
    }
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred. Please try again.';
}
