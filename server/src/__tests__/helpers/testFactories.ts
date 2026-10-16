/**
 * testFactories.ts — Factories for creating test fixtures.
 *
 * Centralising fixture creation means tests stay readable and changes to
 * model structure only need to be updated in one place.
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../../models/User.model';
import { Lead } from '../../models/Lead.model';
import type { ILead } from '../../models/Lead.model';

// Use a fixed test secret so tests don't depend on .env
export const TEST_JWT_SECRET = 'test_secret_that_is_at_least_32_chars_long!!';

export interface TestUser {
  _id: string;
  name: string;
  email: string;
  token: string;
}

/**
 * Create a user in the test DB and return their id + a signed JWT.
 * The password is hashed with cost factor 4 (minimum) to keep tests fast.
 */
export async function createTestUser(overrides?: {
  name?: string;
  email?: string;
  password?: string;
}): Promise<TestUser> {
  const name = overrides?.name ?? 'Test User';
  const email = overrides?.email ?? 'test@example.com';
  const password = overrides?.password ?? 'Password1';

  const passwordHash = await bcrypt.hash(password, 4);
  const user = await User.create({ name, email, passwordHash });

  const token = jwt.sign(
    { userId: user._id.toString(), email: user.email },
    TEST_JWT_SECRET,
    { expiresIn: '1h' }
  );

  return { _id: user._id.toString(), name, email, token };
}

/** Minimal valid lead payload for POST /leads */
export const leadPayload: Omit<ILead, 'userId' | 'createdAt' | 'updatedAt'> & {
  expectedCloseDate?: string;
} = {
  company: 'Acme Corp',
  contactName: 'Wile E. Coyote',
  email: 'wile@acme.com',
  status: 'New',
  source: 'Website',
  value: 5000,
};

/**
 * Insert a lead directly into the DB (bypasses HTTP layer, useful for
 * setting up state before testing read/update/delete routes).
 */
export async function createTestLead(
  userId: string,
  overrides?: Partial<typeof leadPayload>
) {
  return Lead.create({ ...leadPayload, ...overrides, userId });
}
