# BolderBrain

Multi-tenant SaaS for **360 feedback**, **cognitive (IQ)**, **EQ**, and **psychometric** assessments. Organizations are isolated by `organizationId` on server actions and API routes.

## Architecture

```mermaid
flowchart TB
  subgraph clients [Browsers]
    E[Employee /app]
    A[HR Admin /admin]
    S[Platform Super Admin /super-admin]
  end
  subgraph next [Next.js]
    MW[Middleware: auth, tenant headers, rate limits]
    RSC[Server components and server actions]
  end
  DB[(PostgreSQL + Prisma)]
  clients --> MW --> RSC --> DB
```

- **Auth:** Auth.js (NextAuth v5) with credentials; JWT session holds `tenants[]` (org id, slug, role).
- **Tenant API:** Routes under `/api/tenant/*` require `x-organization-slug` or `x-organization-id` and membership.
- **HR admin:** Cookie `admin-org-slug` selects which org an `ADMIN` user is managing.

## Local setup

1. **Node 20+** and **PostgreSQL** (local or Docker).

   **Docker (easiest):** from the repo root, with Docker Desktop running:

   ```bash
   docker compose up -d
   ```

   This starts Postgres 16 on port **5432** with user/password **`postgres` / `postgres`** and database **`bolderbrain`**, matching the sample `.env` below.

2. Copy environment variables:

```bash
# .env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/bolderbrain"
AUTH_SECRET="generate-a-long-random-string"
```

3. Install and migrate:

```bash
npm install
npx prisma migrate deploy
npx prisma generate
```

4. Seed optional IQ/EQ/psych content into an existing org (from Super Admin, create an organization first), then:

```bash
npm run db:seed
```

5. **Pilot demo (Acme Corp):** creates a full tenant with sample users, 360s, IQ/EQ/psych data, and actions.

```bash
npm run seed:demo
```

Log in as **demo@acme.com** / `demo123` (employee) or **admin@acme.com** / `admin123` (org admin).  
Platform super admins are set in the database (`User.isPlatformSuperAdmin`); use that account for `/super-admin` and **Reset demo data**.

6. Dev server:

```bash
npm run dev
```

## Operations

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health` | Load balancer probe (DB ping). |
| `POST /api/auth/*` | Auth.js (login rate limit: 5 attempts / 15 min per IP in `authorize`). |
| Other `/api/*` | 100 requests / minute per user (or IP if anonymous), excluding `/api/auth` and `/api/health`. |

## Main API surface (server actions)

The app uses **server actions** more than REST. Important entry points:

| Area | Typical modules |
|------|-----------------|
| Assessments (employee) | `src/app/assessments/actions.ts`, `src/app/org/[slug]/assessments/actions.ts` |
| IQ / EQ / Psych | `src/app/app/assessments/*/actions.ts` |
| HR admin | `src/app/admin/hr-actions.ts`, `src/app/admin/org-actions.ts`, `src/app/admin/reports-actions.ts` |
| Platform | `src/app/super-admin/actions.ts`, `src/app/super-admin/development/actions.ts` |

All queries that touch tenant data should filter by `organizationId` (see `requireAdminOrganizationId`, `auth()` session tenants).

## Pre-launch checklist

1. Run **360, IQ, EQ, Psych** flows end-to-end on a staging DB.
2. **Roles:** Employee cannot open `/admin` (middleware + layout). Only platform super admins reach `/super-admin`.
3. **Tenant isolation:** Log in as users in two orgs; confirm assessments and reports do not leak across orgs.
4. **Demo:** `npm run seed:demo` then smoke-test Acme; use **Reset demo data** in Super Admin to verify wipe + reseed.
5. **Performance:** For large orgs, run DB with connection pooling (e.g. PgBouncer) and tune Prisma pool settings for your host.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm start` | Production server |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | Default seed (`prisma/seed.ts`) |
| `npm run seed:demo` | Acme Corp demo (`prisma/seed-demo.ts`) |
