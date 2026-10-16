/**
 * LeadForm.tsx — Create / edit lead modal form.
 *
 * When `initialValues` is provided the form operates in edit mode;
 * otherwise it creates a new lead. The parent controls open state and
 * receives the saved lead via onSuccess().
 *
 * Validation mirrors the server Zod schema so errors appear before any
 * network round-trip. Server validation errors are shown in the AlertBanner
 * as a fallback.
 */
import { useState, useEffect } from 'react';
import { createLead, updateLead } from '../../api/leads.api';
import type { Lead, CreateLeadPayload } from '../../types/lead.types';
import { LEAD_STATUSES, LEAD_SOURCES } from '../../types/lead.types';
import { extractErrorMessage } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { AlertBanner } from '../common/AlertBanner';

// ── Types ─────────────────────────────────────────────────────────────────────

type FormValues = {
  company: string;
  contactName: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  value: string;       // string while editing, coerced to number on submit
  notes: string;
  expectedCloseDate: string;
};

type FieldErrors = Partial<Record<keyof FormValues, string>>;

interface LeadFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (lead: Lead) => void;
  initialValues?: Lead;   // present for edit, absent for create
}

// ── Validation ───────────────────────────────────────────────────────────────

function validate(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.company.trim())
    errors.company = 'Company name is required';
  else if (values.company.trim().length > 150)
    errors.company = 'Company name cannot exceed 150 characters';

  if (!values.contactName.trim())
    errors.contactName = 'Contact name is required';
  else if (values.contactName.trim().length > 100)
    errors.contactName = 'Contact name cannot exceed 100 characters';

  if (!values.email.trim())
    errors.email = 'Email is required';
  else if (!/^\S+@\S+\.\S+$/.test(values.email))
    errors.email = 'Please enter a valid email address';

  if (values.phone && values.phone.trim().length > 30)
    errors.phone = 'Phone cannot exceed 30 characters';

  const num = Number(values.value);
  if (values.value !== '' && (isNaN(num) || num < 0))
    errors.value = 'Value must be a non-negative number';

  if (values.notes.length > 2000)
    errors.notes = 'Notes cannot exceed 2000 characters';

  return errors;
}

// ── Default blank form ────────────────────────────────────────────────────────

const BLANK: FormValues = {
  company: '',
  contactName: '',
  email: '',
  phone: '',
  status: 'New',
  source: 'Other',
  value: '',
  notes: '',
  expectedCloseDate: '',
};

function leadToFormValues(lead: Lead): FormValues {
  return {
    company: lead.company,
    contactName: lead.contactName,
    email: lead.email,
    phone: lead.phone ?? '',
    status: lead.status,
    source: lead.source,
    value: String(lead.value),
    notes: lead.notes ?? '',
    expectedCloseDate: lead.expectedCloseDate
      ? lead.expectedCloseDate.slice(0, 10)   // "YYYY-MM-DD"
      : '',
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LeadForm({ isOpen, onClose, onSuccess, initialValues }: LeadFormProps) {
  const isEditing = Boolean(initialValues);
  const [values, setValues] = useState<FormValues>(BLANK);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync form values whenever the modal opens or initialValues changes
  useEffect(() => {
    if (isOpen) {
      setValues(initialValues ? leadToFormValues(initialValues) : BLANK);
      setFieldErrors({});
      setApiError(null);
    }
  }, [isOpen, initialValues]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof FormValues]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    const errors = validate(values);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const payload: CreateLeadPayload = {
      company: values.company.trim(),
      contactName: values.contactName.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone.trim() || undefined,
      status: values.status as CreateLeadPayload['status'],
      source: values.source as CreateLeadPayload['source'],
      value: values.value === '' ? 0 : Number(values.value),
      notes: values.notes.trim() || undefined,
      expectedCloseDate: values.expectedCloseDate || undefined,
    };

    setIsSubmitting(true);
    try {
      const saved = isEditing
        ? await updateLead(initialValues!._id, payload)
        : await createLead(payload);
      onSuccess(saved);
    } catch (err) {
      setApiError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  const statusOptions = LEAD_STATUSES.map((s) => ({ value: s, label: s }));
  const sourceOptions = LEAD_SOURCES.map((s) => ({ value: s, label: s }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Lead' : 'New Lead'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} noValidate>
        {apiError && <div className="mb-4"><AlertBanner message={apiError} /></div>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Company *"
            name="company"
            value={values.company}
            onChange={handleChange}
            error={fieldErrors.company}
            placeholder="Acme Corp"
          />
          <Input
            label="Contact name *"
            name="contactName"
            value={values.contactName}
            onChange={handleChange}
            error={fieldErrors.contactName}
            placeholder="Jane Smith"
          />
          <Input
            label="Email *"
            type="email"
            name="email"
            value={values.email}
            onChange={handleChange}
            error={fieldErrors.email}
            placeholder="jane@example.com"
          />
          <Input
            label="Phone"
            type="tel"
            name="phone"
            value={values.phone}
            onChange={handleChange}
            error={fieldErrors.phone}
            placeholder="+1 555 000 0000"
          />
          <Select
            label="Status"
            name="status"
            value={values.status}
            onChange={handleChange}
            options={statusOptions}
          />
          <Select
            label="Source"
            name="source"
            value={values.source}
            onChange={handleChange}
            options={sourceOptions}
          />
          <Input
            label="Deal value ($)"
            type="number"
            name="value"
            value={values.value}
            onChange={handleChange}
            error={fieldErrors.value}
            placeholder="0"
            min="0"
          />
          <Input
            label="Expected close date"
            type="date"
            name="expectedCloseDate"
            value={values.expectedCloseDate}
            onChange={handleChange}
            error={fieldErrors.expectedCloseDate}
          />
        </div>

        {/* Notes — full width */}
        <div className="mt-4 flex flex-col gap-1">
          <label htmlFor="notes" className="text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={values.notes}
            onChange={handleChange}
            placeholder="Any relevant context about this lead…"
            className={[
              'w-full rounded-lg border px-3 py-2 text-sm text-gray-900',
              'placeholder:text-gray-400 resize-none',
              'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
              'transition-colors',
              fieldErrors.notes ? 'border-red-400' : 'border-gray-300',
            ].join(' ')}
          />
          {fieldErrors.notes && (
            <p className="text-xs text-red-600" role="alert">{fieldErrors.notes}</p>
          )}
          <p className="text-right text-xs text-gray-400">{values.notes.length}/2000</p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? 'Save changes' : 'Create lead'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
