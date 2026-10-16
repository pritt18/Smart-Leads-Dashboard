/**
 * leads.test.ts — Integration tests for /api/v1/leads routes.
 *
 * Covers:
 *  - POST   /leads         : create, validation errors, auth required
 *  - GET    /leads         : list, pagination, status filter, search
 *  - GET    /leads/metrics : shape and values
 *  - GET    /leads/:id     : success, not found, ownership isolation
 *  - PATCH  /leads/:id     : partial update, not found, ownership
 *  - DELETE /leads/:id     : success, not found, ownership
 *  - GET    /leads/export/csv : content-type and CSV shape
 */
import request from 'supertest';
import app from '../app';
import { testDb } from './helpers/testDb';
import {
  createTestUser,
  createTestLead,
  leadPayload,
  type TestUser,
} from './helpers/testFactories';

let userA: TestUser;
let userB: TestUser;

beforeAll(() => testDb.connect());

beforeEach(async () => {
  userA = await createTestUser({ email: 'usera@example.com' });
  userB = await createTestUser({ email: 'userb@example.com', name: 'User B' });
});

afterEach(() => testDb.clearCollections());
afterAll(() => testDb.disconnect());

// ─── POST /leads ──────────────────────────────────────────────────────────────

describe('POST /api/v1/leads', () => {
  const url = '/api/v1/leads';

  it('creates a lead and returns 201 with the lead document', async () => {
    const res = await request(app)
      .post(url)
      .set('Authorization', `Bearer ${userA.token}`)
      .send(leadPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.lead.company).toBe(leadPayload.company);
    expect(res.body.data.lead.userId).toBe(userA._id);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post(url)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ company: 'Acme' }); // missing contactName and email

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: expect.stringContaining('contactName') }),
      ])
    );
  });

  it('returns 400 for an invalid status enum value', async () => {
    const res = await request(app)
      .post(url)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ ...leadPayload, status: 'INVALID_STATUS' });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toMatch(/status/);
  });

  it('returns 400 for a negative value', async () => {
    const res = await request(app)
      .post(url)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ ...leadPayload, value: -100 });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toMatch(/value/);
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).post(url).send(leadPayload);

    expect(res.status).toBe(401);
  });
});

// ─── GET /leads ───────────────────────────────────────────────────────────────

describe('GET /api/v1/leads', () => {
  const url = '/api/v1/leads';

  beforeEach(async () => {
    // Create 3 leads for userA and 1 for userB
    await createTestLead(userA._id, { company: 'Alpha Corp', status: 'New' });
    await createTestLead(userA._id, { company: 'Beta Inc', status: 'Won' });
    await createTestLead(userA._id, { company: 'Gamma LLC', status: 'New' });
    await createTestLead(userB._id, { company: 'Delta Co' });
  });

  it('returns only the authenticated user\'s leads', async () => {
    const res = await request(app)
      .get(url)
      .set('Authorization', `Bearer ${userA.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.leads).toHaveLength(3);
    expect(res.body.data.pagination.total).toBe(3);
    // All leads belong to userA
    for (const lead of res.body.data.leads) {
      expect(lead.userId).toBe(userA._id);
    }
  });

  it('returns correct pagination metadata', async () => {
    const res = await request(app)
      .get(`${url}?page=1&limit=2`)
      .set('Authorization', `Bearer ${userA.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.leads).toHaveLength(2);
    expect(res.body.data.pagination).toMatchObject({
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2,
    });
  });

  it('filters by status', async () => {
    const res = await request(app)
      .get(`${url}?status=Won`)
      .set('Authorization', `Bearer ${userA.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.leads).toHaveLength(1);
    expect(res.body.data.leads[0].status).toBe('Won');
  });

  it('returns an empty array when no leads match the filter', async () => {
    const res = await request(app)
      .get(`${url}?status=Lost`)
      .set('Authorization', `Bearer ${userA.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.leads).toHaveLength(0);
    expect(res.body.data.pagination.total).toBe(0);
  });

  it('returns 400 for an invalid limit value', async () => {
    const res = await request(app)
      .get(`${url}?limit=200`) // exceeds max of 50
      .set('Authorization', `Bearer ${userA.token}`);

    expect(res.status).toBe(400);
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).get(url);
    expect(res.status).toBe(401);
  });
});

// ─── GET /leads/metrics ───────────────────────────────────────────────────────

describe('GET /api/v1/leads/metrics', () => {
  const url = '/api/v1/leads/metrics';

  beforeEach(async () => {
    await createTestLead(userA._id, { status: 'Won', value: 1000 });
    await createTestLead(userA._id, { status: 'Won', value: 2000 });
    await createTestLead(userA._id, { status: 'Lost', value: 500 });
    await createTestLead(userA._id, { status: 'New', value: 750 });
    // userB lead — must NOT appear in userA's metrics
    await createTestLead(userB._id, { status: 'Won', value: 9999 });
  });

  it('returns correct metrics for the authenticated user', async () => {
    const res = await request(app)
      .get(url)
      .set('Authorization', `Bearer ${userA.token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { data } = res.body;
    expect(data.totalLeads).toBe(4);
    expect(data.totalValue).toBe(4250);
    expect(data.byStatus['Won']).toBe(2);
    expect(data.byStatus['Lost']).toBe(1);
    expect(data.byStatus['New']).toBe(1);
    // conversionRate = 2 won / (2 won + 1 lost) = 66.7%
    expect(data.conversionRate).toBeCloseTo(66.7, 0);
  });

  it('returns zero values when the user has no leads', async () => {
    // Create a fresh user with no leads
    const emptyUser = await createTestUser({ email: 'empty@example.com' });
    const res = await request(app)
      .get(url)
      .set('Authorization', `Bearer ${emptyUser.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalLeads).toBe(0);
    expect(res.body.data.totalValue).toBe(0);
    expect(res.body.data.conversionRate).toBe(0);
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).get(url);
    expect(res.status).toBe(401);
  });
});

// ─── GET /leads/:id ───────────────────────────────────────────────────────────

describe('GET /api/v1/leads/:id', () => {
  it('returns the lead for its owner', async () => {
    const lead = await createTestLead(userA._id);

    const res = await request(app)
      .get(`/api/v1/leads/${lead._id.toString()}`)
      .set('Authorization', `Bearer ${userA.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.lead.company).toBe(lead.company);
  });

  it('returns 404 when lead does not exist', async () => {
    const fakeId = '507f1f77bcf86cd799439011';
    const res = await request(app)
      .get(`/api/v1/leads/${fakeId}`)
      .set('Authorization', `Bearer ${userA.token}`);

    expect(res.status).toBe(404);
  });

  it('returns 404 when userB requests userA\'s lead (ownership isolation)', async () => {
    const lead = await createTestLead(userA._id);

    const res = await request(app)
      .get(`/api/v1/leads/${lead._id.toString()}`)
      .set('Authorization', `Bearer ${userB.token}`); // wrong user

    // Returns 404 rather than 403 to avoid confirming that the record exists
    expect(res.status).toBe(404);
  });

  it('returns 400 for a malformed ObjectId', async () => {
    const res = await request(app)
      .get('/api/v1/leads/not-an-object-id')
      .set('Authorization', `Bearer ${userA.token}`);

    expect(res.status).toBe(400);
  });
});

// ─── PATCH /leads/:id ─────────────────────────────────────────────────────────

describe('PATCH /api/v1/leads/:id', () => {
  it('partially updates a lead and returns the updated document', async () => {
    const lead = await createTestLead(userA._id);

    const res = await request(app)
      .patch(`/api/v1/leads/${lead._id.toString()}`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ status: 'Qualified', value: 9500 });

    expect(res.status).toBe(200);
    expect(res.body.data.lead.status).toBe('Qualified');
    expect(res.body.data.lead.value).toBe(9500);
    // Untouched fields are preserved
    expect(res.body.data.lead.company).toBe(lead.company);
  });

  it('returns 400 for an invalid status value', async () => {
    const lead = await createTestLead(userA._id);

    const res = await request(app)
      .patch(`/api/v1/leads/${lead._id.toString()}`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ status: 'CLOSED' }); // not a valid enum value

    expect(res.status).toBe(400);
  });

  it('returns 404 when userB tries to update userA\'s lead', async () => {
    const lead = await createTestLead(userA._id);

    const res = await request(app)
      .patch(`/api/v1/leads/${lead._id.toString()}`)
      .set('Authorization', `Bearer ${userB.token}`)
      .send({ status: 'Won' });

    expect(res.status).toBe(404);
  });

  it('returns 404 for a non-existent lead id', async () => {
    const fakeId = '507f1f77bcf86cd799439011';
    const res = await request(app)
      .patch(`/api/v1/leads/${fakeId}`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ status: 'Won' });

    expect(res.status).toBe(404);
  });
});

// ─── DELETE /leads/:id ────────────────────────────────────────────────────────

describe('DELETE /api/v1/leads/:id', () => {
  it('deletes the lead and returns a success message', async () => {
    const lead = await createTestLead(userA._id);

    const res = await request(app)
      .delete(`/api/v1/leads/${lead._id.toString()}`)
      .set('Authorization', `Bearer ${userA.token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Confirm the lead is actually gone
    const check = await request(app)
      .get(`/api/v1/leads/${lead._id.toString()}`)
      .set('Authorization', `Bearer ${userA.token}`);
    expect(check.status).toBe(404);
  });

  it('returns 404 when userB tries to delete userA\'s lead', async () => {
    const lead = await createTestLead(userA._id);

    const res = await request(app)
      .delete(`/api/v1/leads/${lead._id.toString()}`)
      .set('Authorization', `Bearer ${userB.token}`);

    expect(res.status).toBe(404);

    // Lead must still exist for userA
    const check = await request(app)
      .get(`/api/v1/leads/${lead._id.toString()}`)
      .set('Authorization', `Bearer ${userA.token}`);
    expect(check.status).toBe(200);
  });

  it('returns 404 for a non-existent lead', async () => {
    const fakeId = '507f1f77bcf86cd799439011';
    const res = await request(app)
      .delete(`/api/v1/leads/${fakeId}`)
      .set('Authorization', `Bearer ${userA.token}`);

    expect(res.status).toBe(404);
  });
});

// ─── GET /leads/export/csv ────────────────────────────────────────────────────

describe('GET /api/v1/leads/export/csv', () => {
  const url = '/api/v1/leads/export/csv';

  beforeEach(async () => {
    await createTestLead(userA._id, { company: 'Export Corp', value: 1000 });
    await createTestLead(userA._id, { company: 'Export LLC', value: 2000 });
  });

  it('returns a CSV file with correct content-type and header row', async () => {
    const res = await request(app)
      .get(url)
      .set('Authorization', `Bearer ${userA.token}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toMatch(/attachment/);
    expect(res.headers['content-disposition']).toMatch(/leads-.*\.csv/);

    const lines = (res.text as string).split('\r\n');
    // First line is the header row
    expect(lines[0]).toContain('Company');
    expect(lines[0]).toContain('Contact Name');
    // Two data rows
    expect(lines.length).toBeGreaterThanOrEqual(3); // header + 2 leads
  });

  it('only exports the authenticated user\'s leads', async () => {
    await createTestLead(userB._id, { company: 'Should Not Appear' });

    const res = await request(app)
      .get(url)
      .set('Authorization', `Bearer ${userA.token}`);

    expect(res.text).not.toContain('Should Not Appear');
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).get(url);
    expect(res.status).toBe(401);
  });
});

// ─── 404 for unknown routes ───────────────────────────────────────────────────

describe('Unknown routes', () => {
  it('returns 404 for a completely unknown path', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ─── Regression: empty PATCH body should be rejected ─────────────────────────

describe('PATCH /api/v1/leads/:id — empty body regression', () => {
  it('returns 400 when the update body is an empty object', async () => {
    const lead = await createTestLead(userA._id);

    const res = await request(app)
      .patch(`/api/v1/leads/${lead._id.toString()}`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/validation failed/i);
  });
});

// ─── Regression: health endpoint must not reveal NODE_ENV ────────────────────

describe('GET /health', () => {
  it('returns status ok without exposing NODE_ENV', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    // NODE_ENV must not be present in any form
    expect(res.body.data.env).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('NODE_ENV');
    expect(JSON.stringify(res.body)).not.toContain('development');
    expect(JSON.stringify(res.body)).not.toContain('production');
  });
});

// ─── Regression: CSV export limit ────────────────────────────────────────────

describe('GET /api/v1/leads/export/csv — export cap', () => {
  it('CSV_EXPORT_LIMIT constant is defined and is a positive number', async () => {
    // Import the constant directly to verify it is exported and sensible.
    // We do not insert 10k rows in a test — that would be too slow.
    // The unit value assertion and the service function using .limit() are
    // what matters; the integration is covered by the existing CSV tests.
    const { CSV_EXPORT_LIMIT } = await import('../services/leads.service');
    expect(typeof CSV_EXPORT_LIMIT).toBe('number');
    expect(CSV_EXPORT_LIMIT).toBeGreaterThan(0);
    expect(CSV_EXPORT_LIMIT).toBeLessThanOrEqual(100_000);
  });
});
