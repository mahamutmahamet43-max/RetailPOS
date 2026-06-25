# RetailPOS — Environment Variable Checklist

## How to Configure

1. Go to **Vercel Dashboard > Project > Settings > Environment Variables**
2. Add each variable below
3. Set scope to "Production" (and "Preview" if desired)
4. Redeploy after configuration

## Required Variables

| # | Variable | Description | Example Value | Set? |
|---|---|---|---|---|
| 1 | `DATABASE_URL` | Neon PostgreSQL connection string (pooled) | `postgresql://user:pass@ep-xxx.aws.neon.tech/neondb?sslmode=require` | ☐ |
| 2 | `AUTH_SECRET` | Random 32-byte base64 key | `openssl rand -base64 32` output | ☐ |
| 3 | `AUTH_URL` | Production app URL | `https://retailpos.vercel.app` | ☐ |
| 4 | `NEXT_PUBLIC_APP_URL` | Same as AUTH_URL | `https://retailpos.vercel.app` | ☐ |
| 5 | `NEXT_PUBLIC_SENTRY_DSN` | Sentry client key (DSN) | `https://xxx@xxx.ingest.sentry.io/xxx` | ☐ |
| 6 | `SENTRY_DSN` | Sentry server key (same DSN) | `https://xxx@xxx.ingest.sentry.io/xxx` | ☐ |
| 7 | `EMAIL_PROVIDER` | Email provider | `resend` | ☐ |
| 8 | `EMAIL_FROM_ADDRESS` | Sender email | `noreply@yourdomain.com` | ☐ |
| 9 | `RESEND_API_KEY` | Resend API key | `re_xxx` | ☐ |

## Recommended Variables

| # | Variable | Description | Example Value | Set? |
|---|---|---|---|---|
| 10 | `LOG_LEVEL` | Log verbosity | `info` | ☐ |
| 11 | `PAYMENT_SANDBOX` | Enable sandbox mode | `true` | ☐ |

## Payment Provider Variables (if using)

### Stripe
| # | Variable | Description | Set? |
|---|---|---|---|
| 12 | `STRIPE_SECRET_KEY` | Stripe secret key | ☐ |
| 13 | `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | ☐ |
| 14 | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | ☐ |

### Zaad (Hormuud)
| # | Variable | Description | Set? |
|---|---|---|---|
| 15 | `ZAAD_API_KEY` | Zaad API key | ☐ |
| 16 | `ZAAD_API_SECRET` | Zaad API secret | ☐ |
| 17 | `ZAAD_WEBHOOK_SECRET` | Zaad webhook secret | ☐ |
| 18 | `ZAAD_API_URL` | Zaad API base URL | ☐ |

### EVC Plus (Telesom)
| # | Variable | Description | Set? |
|---|---|---|---|
| 19 | `EVC_PLUS_API_KEY` | EVC Plus API key | ☐ |
| 20 | `EVC_PLUS_API_SECRET` | EVC Plus API secret | ☐ |
| 21 | `EVC_PLUS_WEBHOOK_SECRET` | EVC Plus webhook secret | ☐ |
| 22 | `EVC_PLUS_API_URL` | EVC Plus API base URL | ☐ |

### Sahal (Somtel/Golis)
| # | Variable | Description | Set? |
|---|---|---|---|
| 23 | `SAHAL_API_KEY` | Sahal API key | ☐ |
| 24 | `SAHAL_API_SECRET` | Sahal API secret | ☐ |
| 25 | `SAHAL_WEBHOOK_SECRET` | Sahal webhook secret | ☐ |
| 26 | `SAHAL_API_URL` | Sahal API base URL | ☐ |

## SMTP (fallback email provider)

| # | Variable | Description | Set? |
|---|---|---|---|
| 27 | `SMTP_HOST` | SMTP server host | ☐ |
| 28 | `SMTP_PORT` | SMTP server port | ☐ |
| 29 | `SMTP_SECURE` | Use TLS | ☐ |
| 30 | `SMTP_USER` | SMTP username | ☐ |
| 31 | `SMTP_PASS` | SMTP password | ☐ |

## SendGrid

| # | Variable | Description | Set? |
|---|---|---|---|
| 32 | `SENDGRID_API_KEY` | SendGrid API key | ☐ |

## Postmark

| # | Variable | Description | Set? |
|---|---|---|---|
| 33 | `POSTMARK_API_KEY` | Postmark API key | ☐ |

## Cloudinary (image uploads)

| # | Variable | Description | Set? |
|---|---|---|---|
| 34 | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | ☐ |
| 35 | `CLOUDINARY_API_KEY` | Cloudinary API key | ☐ |
| 36 | `CLOUDINARY_API_SECRET` | Cloudinary API secret | ☐ |

## Sentry (optional monitoring improvements)

| # | Variable | Description | Set? |
|---|---|---|---|
| 37 | `SENTRY_ORG` | Sentry organization slug | ☐ |
| 38 | `SENTRY_PROJECT` | Sentry project slug | ☐ |
| 39 | `SENTRY_AUTH_TOKEN` | Sentry auth token (for source maps) | ☐ |

---

### Quick Setup (6 essential variables for MVP)

```
DATABASE_URL, AUTH_SECRET, AUTH_URL, NEXT_PUBLIC_APP_URL, EMAIL_PROVIDER, RESEND_API_KEY
```
