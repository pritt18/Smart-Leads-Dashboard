/**
 * DeleteConfirmModal.tsx — Confirmation dialog before deleting a lead.
 * Shows the lead's company and contact name so the user knows exactly
 * what they are about to delete.
 */
import { useState } from 'react';
import { deleteLead } from '../../api/leads.api';
import { extractErrorMessage } from '../../utils/formatters';
import type { Lead } from '../../types/lead.types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { AlertBanner } from '../common/AlertBanner';

interface DeleteConfirmModalProps {
  lead: Lead | null;
  onClose: () => void;
  onSuccess: (deletedId: string) => void;
}

export function DeleteConfirmModal({ lead, onClose, onSuccess }: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!lead) return;
    setIsDeleting(true);
    setError(null);
    try {
      await deleteLead(lead._id);
      onSuccess(lead._id);
    } catch (err) {
      setError(extractErrorMessage(err));
      setIsDeleting(false);
    }
  }

  return (
    <Modal
      isOpen={Boolean(lead)}
      onClose={onClose}
      title="Delete Lead"
      maxWidth="max-w-md"
    >
      {error && <div className="mb-4"><AlertBanner message={error} /></div>}

      <p className="text-sm text-gray-600">
        Are you sure you want to delete{' '}
        <span className="font-semibold text-gray-900">{lead?.contactName}</span>
        {' '}at{' '}
        <span className="font-semibold text-gray-900">{lead?.company}</span>?
        This action cannot be undone.
      </p>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button variant="danger" isLoading={isDeleting} onClick={() => void handleDelete()}>
          Delete lead
        </Button>
      </div>
    </Modal>
  );
}
