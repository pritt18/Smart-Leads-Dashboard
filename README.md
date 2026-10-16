# LeadFlow — Smart Leads Management Dashboard

A full-stack MERN application for managing sales leads. Built with React, TypeScript, Express, MongoDB, and JWT authentication.

---

## Project structure

```
smart-leads-dashboard/
├── client/          # React + Vite + Tailwind frontend (to be built)
├── server/          # Express + TypeScript API
│   ├── src/
│   │   ├── config/          # env loader, DB connection
│   │   ├── controllers/     # HTTP request/response handlers
│   │   ├── middleware/       # auth, validate, error handlers
│   │   ├── models/          # Mongoose schemas (User, Lead)
│   │   ├── routes/          # Express routers
│   │   ├── schemas/         # Zod request validation schemas
│   │   ├── services/        # Business logic (no HTTP coupling)
│   │   ├── types/           # Shared TypeScript types
│   │   └── __tests__/       # Jest + Supertest integration tests
│   ├── .env                 # Local secrets (never commit)
│   ├── .env.example         # Template — commit this
│   └── package.json
└── .env.example
```

---

## Getting started

### Prerequisites

- Node.js 18+
- MongoDB running locally (`mongodb://localhost:27017`) **or** a MongoDB Atlas connection string

### 1. Configure environment

```bash
# Copy the template
cp .env.example server/.env

# Edit server/.env — set a real JWT_SECRET (min 32 chars) and MONGODB_URI
```

### 2. Install dependencies

```bash
cd server
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Server starts on `http://localhost:5000`. Logs each request to the console in development mode.

### 4. Build for production

```bash
npm run build   # compiles TypeScript to dist/
npm start       # runs the compiled output
```

---

## Running tests

Tests use `mongodb-memory-server` — no external MongoDB required.

```bash
# Run all tests once
npm test

# Run with coverage report
npm run test:coverage
```

Test output:
```
Test Suites: 2 passed, 2 total
Tests:       43 passed, 43 total
```

---

## API reference

Base URL: `http://localhost:5000/api/v1`

### Authentication

| Method | Path              | Auth | Description              |
|--------|-------------------|------|--------------------------|
| POST   | /auth/register    | —    | Create account           |
| POST   | /auth/login       | —    | Login, receive JWT       |
| GET    | /auth/me          | JWT  | Current user profile     |

All protected routes require: `Authorization: Bearer <token>`

### Leads

| Method | Path                  | Auth | Description                          |
|--------|-----------------------|------|--------------------------------------|
| GET    | /leads                | JWT  | List leads (search/filter/sort/page) |
| POST   | /leads                | JWT  | Create lead                          |
| GET    | /leads/metrics        | JWT  | Dashboard metrics                    |
| GET    | /leads/export/csv     | JWT  | Export filtered leads as CSV         |
| GET    | /leads/:id            | JWT  | Get single lead                      |
| PATCH  | /leads/:id            | JWT  | Partial update                       |
| DELETE | /leads/:id            | JWT  | Delete lead                          |

#### GET /leads — query parameters

| Param      | Type   | Default    | Notes                              |
|------------|--------|------------|------------------------------------|
| page       | number | 1          |                                    |
| limit      | number | 10         | max 50                             |
| search     | string | —          | full-text on company + contactName |
| status     | string | —          | New/Contacted/Qualified/Proposal/Won/Lost |
| source     | string | —          | Website/Referral/Cold Call/LinkedIn/Event/Other |
| sortBy     | string | createdAt  | createdAt/updatedAt/value/company/status |
| sortOrder  | string | desc       | asc / desc                         |

#### Response envelope

```jsonc
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "message": "...", "errors": [{ "field": "email", "message": "..." }] }
```

---

## Environment variables

| Variable       | Required | Default               | Notes                              |
|----------------|----------|-----------------------|------------------------------------|
| PORT           | No       | 5000                  |                                    |
| NODE_ENV       | No       | development           |                                    |
| MONGODB_URI    | Yes      | —                     | Local or Atlas connection string   |
| JWT_SECRET     | Yes      | —                     | Min 32 characters                  |
| JWT_EXPIRES_IN | No       | 24h                   | Any value accepted by jsonwebtoken |
| CLIENT_ORIGIN  | No       | http://localhost:5173 | Comma-separated for multiple       |

---

## Security notes

- Passwords hashed with bcrypt (cost factor 12)
- JWT secret enforced to minimum 32 characters at startup
- All leads queries are scoped to the authenticated user's ID
- `passwordHash` excluded from all query results via Mongoose `select: false`
- Rate limiting: 20 requests / 15 min on auth routes; 300 / 15 min globally
- CORS restricted to the configured `CLIENT_ORIGIN`
- Helmet sets secure HTTP headers on every response
- Request bodies capped at 10 KB
