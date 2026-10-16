/**
 * auth.test.ts — Integration tests for /api/v1/auth routes.
 *
 * Covers:
 *  - POST /register: success, duplicate email, validation failures
 *  - POST /login: success, wrong password, unknown email, validation failures
 *  - GET  /me: success, missing token, expired/malformed token
 */
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import { testDb } from './helpers/testDb';
import { createTestUser, TEST_JWT_SECRET } from './helpers/testFactories';

beforeAll(() => testDb.connect());
afterEach(() => testDb.clearCollections());
afterAll(() => testDb.disconnect());

// ─── POST /register ───────────────────────────────────────────────────────────

describe('POST /api/v1/auth/register', () => {
  const url = '/api/v1/auth/register';
  const validBody = {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'Password1',
  };

  it('registers a new user and returns a JWT', async () => {
    const res = await request(app).post(url).send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('jane@example.com');
    // Password must never be in the response
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('returns 409 when the email is already registered', async () => {
    await request(app).post(url).send(validBody); // first registration
    const res = await request(app).post(url).send(validBody); // duplicate

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post(url)
      .send({ email: 'jane@example.com', password: 'Password1' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: expect.stringContaining('name') }),
      ])
    );
  });

  it('returns 400 for an invalid email format', async () => {
    const res = await request(app)
      .post(url)
      .send({ name: 'Jane', email: 'not-an-email', password: 'Password1' });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toMatch(/email/);
  });

  it('returns 400 when password is too weak (no uppercase)', async () => {
    const res = await request(app)
      .post(url)
      .send({ name: 'Jane', email: 'jane@example.com', password: 'password1' });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toMatch(/password/);
  });

  it('returns 400 when password is shorter than 8 chars', async () => {
    const res = await request(app)
      .post(url)
      .send({ name: 'Jane', email: 'jane@example.com', password: 'Aa1' });

    expect(res.status).toBe(400);
  });
});

// ─── POST /login ──────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/login', () => {
  const url = '/api/v1/auth/login';

  beforeEach(async () => {
    // Pre-create a user for login tests
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Jane Smith', email: 'jane@example.com', password: 'Password1' });
  });

  it('logs in with valid credentials and returns a JWT', async () => {
    const res = await request(app)
      .post(url)
      .send({ email: 'jane@example.com', password: 'Password1' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('jane@example.com');
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post(url)
      .send({ email: 'jane@example.com', password: 'WrongPass9' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    // Generic message — must not reveal whether email exists
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('returns 401 for an unknown email', async () => {
    const res = await request(app)
      .post(url)
      .send({ email: 'nobody@example.com', password: 'Password1' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('returns 400 when body is missing email', async () => {
    const res = await request(app).post(url).send({ password: 'Password1' });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toMatch(/email/);
  });
});

// ─── GET /me ──────────────────────────────────────────────────────────────────

describe('GET /api/v1/auth/me', () => {
  const url = '/api/v1/auth/me';

  it('returns the current user profile with a valid token', async () => {
    const user = await createTestUser();

    const res = await request(app)
      .get(url)
      .set('Authorization', `Bearer ${user.token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(user.email);
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('returns 401 when no Authorization header is provided', async () => {
    const res = await request(app).get(url);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for a malformed token', async () => {
    const res = await request(app)
      .get(url)
      .set('Authorization', 'Bearer this.is.not.a.jwt');

    expect(res.status).toBe(401);
  });

  it('returns 401 for an expired token', async () => {
    const expiredToken = jwt.sign(
      { userId: 'some-id', email: 'x@x.com' },
      TEST_JWT_SECRET,
      { expiresIn: '0s' }
    );

    const res = await request(app)
      .get(url)
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
  });
});
