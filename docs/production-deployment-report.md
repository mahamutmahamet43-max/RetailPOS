# RetailPOS — Production Deployment Report

## 1. Project Overview

| Property | Value |
|---|---|
| Application | RetailPOS — Point of Sale System |
| Framework | Next.js 15.5.19 (App Router) |
| Database | PostgreSQL (Neon) |
| Auth | NextAuth v5 (Credentials + JWT) |
| ORM | Prisma 6 |
| Language | TypeScript 5 |
| Package Manager | npm |

## 2. Infrastructure

| Service | Purpose | Status |
|---|---|---|
| **Vercel** | Hosting, CDN, HTTPS, auto-deploy | Configured |
| **Neon PostgreSQL** | Production database | Configured |
| **Sentry** | Error monitoring | Configured |
| **Resend** | Email delivery | Configured |
| **Cloudinary** | Image uploads | Env vars ready |

### 2.1 Vercel Configuration (`vercel.json`)

```json
{
  "framework": "nextjs",
  "buildCommand": "prisma generate && prisma migrate deploy && next build",
  "outputDirectory": ".next",
  "installCommand": "npm install"
}
```

### 2.2 Database

- **Provider:** Neon PostgreSQL (serverless)
- **Migration strategy:** `prisma migrate deploy` runs during Vercel build
- **Post-install:** `prisma generate` generates client after `npm install`
- **Migration file:** `prisma/migrations/0001_init/` (full schema)

### 2.3 Monitoring (Sentry)

- **Package:** `@sentry/nextjs@10.60.0`
- **Server init:** `src/instrumentation.ts` — `register()` function
- **Client init:** `src/instrumentation-client.ts`
- **Error tracking:** `src/app/global-error.tsx` captures unhandled errors
- **Request errors:** `onRequestError` hook for server component errors
- **Sample rate:** 0.1 (traces), 1.0 (replays on error)

### 2.4 Email (Resend)

- **Provider:** Resend (recommended for production)
- **From address:** `noreply@yourdomain.com`
- **Config:** `src/lib/email/config.ts`
- **Templates:** 10 HTML+plain-text templates in `src/lib/email/templates/`

## 3. Environment Variables

See `.env.example` for complete documentation. Key variable groups:

| Group | Variables | Required |
|---|---|---|
| Database | `DATABASE_URL` | Yes |
| Auth | `AUTH_SECRET`, `AUTH_URL` | Yes |
| App URL | `NEXT_PUBLIC_APP_URL` | Yes |
| Sentry | `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN` | Yes |
| Email | `EMAIL_PROVIDER`, `EMAIL_FROM_ADDRESS`, `RESEND_API_KEY` | Yes |
| Payments | `PAYMENT_SANDBOX`, `STRIPE_SECRET_KEY`, etc. | Conditional |
| Logging | `LOG_LEVEL` | No (defaults to `info`) |

## 4. Security

| Measure | Implementation |
|---|---|
| HTTPS | Vercel (automatic) |
| CSP Headers | `next.config.ts` — strict CSP policy |
| HSTS | `max-age=63072000; includeSubDomains; preload` |
| X-Frame-Options | `DENY` |
| X-Content-Type-Options | `nosniff` |
| Rate limiting | Built into API routes |
| Input validation | Zod schemas on all POST routes |
| JWT session | 24h maxAge, secure cookies in production |
| Plan enforcement | Server-side subscription checks (Milestone 14) |

## 5. Protected Routes (Subscription Enforcement)

| Route | Enforcement | Limit Resource |
|---|---|---|
| `POST /api/products` | Product count check | `products` |
| `POST /api/customers` | Customer count check | `customers` |
| `POST /api/sales` | Subscription active + monthly sales cap | `monthlySales` |
| Webhook handler | HMAC verification | N/A |

## 6. Build Status

- **Compilation:** ✅ Compiled successfully
- **Type checking:** ✅ 0 type errors
- **Linting:** ✅ 3 pre-existing `<img>` warnings (non-blocking)
- **Edge warnings:** Prisma/bcryptjs in middleware (expected, non-blocking)
- **Pages generated:** 32/32 static pages
- **Build ID:** Generated successfully

## 7. Deployment Checklist

### Pre-Deployment
- [ ] Push code to GitHub repository
- [ ] Connect GitHub repo to Vercel
- [ ] Configure all environment variables in Vercel dashboard
- [ ] Create Neon PostgreSQL database
- [ ] Run `openssl rand -base64 32` to generate `AUTH_SECRET`

### Deployment
- [ ] Deploy via Vercel (automatic on `main` branch push)
- [ ] Verify HTTPS certificate issued
- [ ] Run seed: `npm run db:seed` (via Vercel CLI or one-off command)
- [ ] Enable automatic deployments from GitHub

### Post-Deployment Verification
- [ ] Health check: `GET /api/health`
- [ ] Login with admin credentials
- [ ] Create a product
- [ ] Create a customer
- [ ] Process a POS sale
- [ ] View reports
- [ ] Verify email delivery
- [ ] Test PWA installation
- [ ] Verify mobile-responsive layout
- [ ] Check Sentry dashboard for errors
