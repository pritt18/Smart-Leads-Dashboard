/**
 * Badge.tsx — Coloured pill badge for lead status display.
 */
import type { LeadStatus } from '../../types/lead.types';

interface BadgeProps {
  status: LeadStatus;
}

const statusStyles: Record<LeadStatus, string> = {
  New:        'bg-blue-100 text-blue-800',
  Contacted:  'bg-yellow-100 text-yellow-800',
  Qualified:  'bg-purple-100 text-purple-800',
  Proposal:   'bg-orange-100 text-orange-800',
  Won:        'bg-green-100 text-green-800',
  Lost:       'bg-red-100 text-red-800',
};

export function Badge({ status }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}
