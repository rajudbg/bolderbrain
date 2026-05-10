# CloudPanel Deployment

This app is a Next.js Node.js application with PostgreSQL, Prisma, Auth.js, optional Redis, optional Resend email, and optional OpenRouter AI.

## 1. Create the CloudPanel site

1. In CloudPanel, create a Node.js site for your domain.
2. Use Node.js 20 or newer.
3. Set the app port to `3000` unless you already use that port.
4. Upload or clone this repository into the site user's application directory.

CloudPanel forwards NGINX traffic to the configured Node.js app port, so the app start script binds Next.js to `127.0.0.1` and reads the port from `PORT`.

## 2. Configure environment variables

Create `.env` from `.env.example` and set production values:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/bolderbrain"
AUTH_SECRET="generate-a-long-random-secret"
NEXTAUTH_URL="https://your-domain.com"
CRON_SECRET="generate-a-second-random-secret"
```

Recommended production additions:

```bash
RESEND_API_KEY="..."
EMAIL_FROM="BolderBrain <noreply@your-domain.com>"
DEMO_REQUEST_TO="sales@your-domain.com"
OPENROUTER_API_KEY="..."
REDIS_URL="redis://127.0.0.1:6379"
ASSESSMENT_UNIT_COST_USD="12"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_tXcOz47WMwAJRt"
RAZORPAY_KEY_ID="rzp_test_tXcOz47WMwAJRt"
RAZORPAY_KEY_SECRET="..."
RAZORPAY_CURRENCY="INR"
```

The app still runs without Resend, OpenRouter, Redis, or the Razorpay secret, but email delivery, AI generation, AI cache, reminder deduplication, and payment order creation are stronger when those services are configured.

## 3. Install, migrate, and build

Run these commands as the CloudPanel site user from the application directory:

```bash
npm ci
npm run db:deploy
npm run deploy:check
```

If this is the first production launch, create a platform super admin after the first deploy:

```bash
npm run seed:super-admin
```

## 4. Start the application

Set CloudPanel's Node.js startup command to:

```bash
PORT=3000 npm run start
```

If you choose another CloudPanel app port, use the same number in `PORT`.

## 5. Add scheduled reminders

CloudPanel can run cron jobs from the Cron Jobs tab. Add an hourly job like this, replacing the domain and secret:

```bash
curl -fsS -X POST https://your-domain.com/api/cron/training-reminders -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 6. Production checks

Before pointing live users at the app:

1. Visit `https://your-domain.com/api/health` and confirm it returns `ok: true`.
2. Log in as employee, organization admin, and platform super admin.
3. Confirm `/app`, `/admin`, and `/super-admin` access matches each role.
4. Submit the marketing demo form and confirm the request reaches `DEMO_REQUEST_TO` or the server logs.
5. Start one Razorpay test checkout from `/marketing/pricing` and confirm the payment verifies.
6. Launch one 360 assessment, one self-assessment, and one training reminder on a staging organization.
7. Export People and 360 CSV reports.
8. Back up PostgreSQL before every production migration.
