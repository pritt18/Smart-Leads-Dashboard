/**
 * Lead.model.ts — Mongoose schema and model for sales leads.
 *
 * Design decisions:
 * - Every query in the service layer is scoped to `userId`, so all compound
 *   indexes lead with `userId`. This means MongoDB can satisfy every leads
 *   query from an index without a collection scan, and it provides a second
 *   layer of data isolation on top of the JWT ownership check.
 * - A MongoDB text index on `company` + `contactName` enables full-text search
 *   natively without an external search service. One text index per collection
 *   is a MongoDB constraint; all searchable string fields must be in that index.
 * - `value` stores a plain number (currency units, e.g. USD). Currency symbol
 *   and formatting are handled on the frontend to keep the API locale-agnostic.
 * - Enums are defined as TypeScript union types AND as Mongoose enum arrays to
 *   get compile-time safety and runtime validation from a single source of truth.
 */
import mongoose, { Document, Schema } from 'mongoose';

// ─── Enums ───────────────────────────────────────────────────────────────────

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

// ─── TypeScript interface ─────────────────────────────────────────────────────

export interface ILead {
  userId: mongoose.Types.ObjectId;
  company: string;
  contactName: string;
  email: string;
  phone?: string;
  status: LeadStatus;
  source: LeadSource;
  /** Currency amount in the user's chosen unit (e.g. whole USD dollars). */
  value: number;
  notes?: string;
  expectedCloseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type LeadDocument = Document<unknown, object, ILead> &
  ILead & { _id: mongoose.Types.ObjectId };

// ─── Schema ──────────────────────────────────────────────────────────────────

const leadSchema = new Schema<ILead>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
      index: true, // Also part of compound indexes below
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [150, 'Company name cannot exceed 150 characters'],
    },
    contactName: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
      maxlength: [100, 'Contact name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Contact email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: LEAD_STATUSES,
        message: '{VALUE} is not a valid lead status',
      },
      default: 'New',
    },
    source: {
      type: String,
      enum: {
        values: LEAD_SOURCES,
        message: '{VALUE} is not a valid lead source',
      },
      default: 'Other',
    },
    value: {
      type: Number,
      default: 0,
      min: [0, 'Value cannot be negative'],
    },
    notes: {
      type: String,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    expectedCloseDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
//
// All indexes are compound with userId first so MongoDB can use them for the
// owner-scoped queries that every service method issues.

// Primary list query: most recent leads first
leadSchema.index({ userId: 1, createdAt: -1 });

// Filter by status (e.g., kanban board, status dropdown)
leadSchema.index({ userId: 1, status: 1 });

// Sort by value (deal size ranking)
leadSchema.index({ userId: 1, value: -1 });

// Full-text search across company and contact name.
// MongoDB allows only ONE text index per collection, so both searchable
// fields must be combined here.
leadSchema.index(
  { company: 'text', contactName: 'text' },
  {
    name: 'lead_text_search',
    // Weight company name higher than contact name in relevance scoring
    weights: { company: 2, contactName: 1 },
  }
);

// ─── Model ───────────────────────────────────────────────────────────────────

export const Lead = mongoose.model<ILead>('Lead', leadSchema);
