# RetailPOS — Launch Readiness Checklist

## Pre-Launch

### Infrastructure
- [ ] **GitHub repository** — Code pushed and connected to Vercel
- [ ] **Vercel project** — Created and configured (framework: Next.js)
- [ ] **Neon database** — PostgreSQL database provisioned
- [ ] **Neon connection string** — Pooled connection URL obtained
- [ ] **Environment variables** — All 6 required vars configured in Vercel
- [ ] **Prisma migration** — Run on deploy via `prisma migrate deploy`
- [ ] **Seed data** — Run `npx tsx prisma/seed.ts` after first deploy

### Domains & SSL
- [ ] **Vercel subdomain** — `your-app.vercel.app` is active
- [ ] **HTTPS** — Vercel auto-provisions SSL certificate
- [ ] **Custom domain** — (Optional) Configure in Vercel > Domains

### Monitoring
- [ ] **Sentry project** — Created, DSN added to env vars
- [ ] **Sentry errors** — Check dashboard after first deployment
- [ ] **Health endpoint** — `GET /api/health` returns `{"status": "healthy"}`

## Core Feature Verification

### Authentication
- [ ] Registration page loads and accepts new user
- [ ] Login works with admin credentials
- [ ] Session persists across page reloads
- [ ] Logout clears session
- [ ] Password change works

### POS & Sales
- [ ] POS page loads with product grid and checkout panel
- [ ] Products appear in the product grid
- [ ] Adding item to cart updates total
- [ ] Cash payment completes sale
- [ ] Sale number auto-generates
- [ ] Stock decrements after sale
- [ ] Inventory transaction recorded

### Products
- [ ] Product list loads
- [ ] Create product with all fields
- [ ] Edit product
- [ ] Barcode validation (duplicate check)
- [ ] Search/filter products
- [ ] Pagination works

### Customers
- [ ] Customer list loads
- [ ] Create customer
- [ ] Phone number uniqueness enforced
- [ ] Edit customer
- [ ] Search customers

### Inventory
- [ ] Inventory transaction list loads
- [ ] Stock adjustment (IN/OUT) works
- [ ] Low stock indicators shown
- [ ] Inventory summary endpoint works

### Reports
- [ ] Sales report loads with data
- [ ] Best-selling products report
- [ ] Cashier performance report
- [ ] Customer report
- [ ] Inventory report
- [ ] Payment methods report
- [ ] Dashboard report

### Billing & Subscription
- [ ] Billing page loads with plan grid
- [ ] Current subscription displayed
- [ ] Plan upgrade flow works (sandbox)
- [ ] Subscription enforcement in API returns 403 when limit reached
- [ ] Middleware redirects expired subscriptions to billing

### PWA
- [ ] Install prompt appears on supported browsers
- [ ] App works offline (cached shell)
- [ ] Manifest loads correctly
- [ ] Service worker registered
- [ ] Offline page displays when disconnected

### Mobile
- [ ] Responsive layout on mobile viewport
- [ ] Touch targets >= 44px
- [ ] POS layout stacks vertically on mobile
- [ ] Navigation accessible on small screens

## Reliability

### Error Handling
- [ ] 404 page displays for unknown routes
- [ ] Global error boundary catches client errors
- [ ] API returns proper error codes (400, 401, 403, 404, 500)
- [ ] Sentry captures unhandled exceptions

### Database
- [ ] Prisma connection pool working
- [ ] No connection leaks under load
- [ ] Migrations apply cleanly

### Security
- [ ] CSP headers set
- [ ] HSTS header set
- [ ] X-Frame-Options: DENY
- [ ] Secure cookies in production
- [ ] Zod validation on all POST routes

## Performance

### Initial Load
- [ ] First load JS < 200KB (shared: 102KB)
- [ ] Lighthouse Performance score >= 70
- [ ] Images optimized

### API
- [ ] Health check response < 50ms
- [ ] Product list API response < 200ms
- [ ] Sale creation < 500ms (including transaction)

## Go / No-Go

- [ ] All critical features verified in production
- [ ] Environment variables confirmed correct
- [ ] Database migrations applied
- [ ] Sentry receiving events
- [ ] No unhandled console errors
- [ ] Team has deployment credentials
- [ ] Rollback plan documented

---

## Quick Launch Commands

```bash
# After Vercel deployment
# 1. Run database seed (Vercel CLI or one-off)
npx vercel run db:seed    # via Vercel CLI

# 2. Verify health
curl https://your-app.vercel.app/api/health

# 3. Test login
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@retailpos.com","password":"TemporaryPass1!"}'
```
