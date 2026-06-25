# RetailPOS

A modern, production-ready Point of Sale system built with Next.js 15, TypeScript, Prisma, PostgreSQL, and Tailwind CSS.

## Features

- **Point of Sale** — Barcode scanning, product search, cart management, checkout with payment methods, printable receipts
- **Sales History** — Search, filter, void sales with inventory restoration
- **Products & Categories** — Full CRUD with barcode/SKU support, stock tracking
- **Customers** — Customer management with credit limits and spend tracking
- **Inventory Management** — Stock in/out/adjustment with transaction history
- **Reports & Analytics** — Sales, inventory, customers, cashiers with charts (recharts) and export (CSV, XLSX, Print)
- **Subscription & Billing** — Plan-based subscription with trial, payment providers (ZAAD, EVC Plus, Sahal, Stripe)
- **Multi-language** — English and Somali (next-intl)
- **Multi-store** — Store-scoped data isolation
- **Role-based Access** — Owner, Manager, Cashier roles
- **Dark/Light Mode** — Theme support with next-themes
- **Admin System** — Health check, backups, system monitoring

## Tech Stack

| Category        | Technology                               |
| --------------- | ---------------------------------------- |
| Framework       | Next.js 15 (App Router)                  |
| Language        | TypeScript                               |
| Database        | PostgreSQL 16                            |
| ORM             | Prisma 6                                 |
| Auth            | Auth.js (NextAuth v5) with Credentials   |
| UI              | shadcn/ui + Tailwind CSS 4               |
| Forms           | React Hook Form + Zod                    |
| i18n            | next-intl (English + Somali)             |
| Charts          | recharts                                 |
| Styling         | Tailwind CSS 4 + clsx + tailwind-merge   |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd retailpos

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL="postgresql://user:password@localhost:5432/retailpos?schema=public"

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed the database (optional)
npm run db:seed

# Start development server
npm run dev
```

Visit http://localhost:3000

### Default Accounts (after seeding)

| Role    | Email                     | Password      |
| ------- | ------------------------- | ------------- |
| Owner   | admin@retailpos.com       | password123   |
| Manager | manager@retailpos.com     | manager123    |
| Cashier | cashier@retailpos.com     | cashier123    |

## Environment Variables

| Variable       | Required | Default                     | Description                          |
| -------------- | -------- | --------------------------- | ------------------------------------ |
| DATABASE_URL   | Yes      | —                           | PostgreSQL connection string         |
| AUTH_SECRET    | Yes      | —                           | NextAuth secret (generate with `openssl rand -base64 32`) |
| AUTH_URL       | Yes      | `http://localhost:3000`     | Application URL                      |
| LOG_LEVEL      | No       | `info`                      | Log level: debug, info, warn, error  |
| NODE_ENV       | No       | `development`               | Environment mode                     |

## Deployment

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

The application is optimized for Vercel deployment. Set `AUTH_URL` to your Vercel deployment URL.

### Docker

```bash
# Build and start with Docker Compose
docker-compose up -d

# Run database migrations
docker-compose exec app npx prisma migrate deploy

# Seed the database
docker-compose exec app npx prisma db seed
```

### Self-hosted VPS

```bash
# Build the application
npm run build

# Start the production server
npm start

# Or use PM2
npm i -g pm2
pm2 start npm --name "retailpos" -- start
```

## Database

### Migrations

```bash
# Development
npx prisma migrate dev --name <migration-name>

# Production
npx prisma migrate deploy
```

### Seed

```bash
npm run db:seed
```

### Studio (GUI)

```bash
npm run db:studio
```

## API Endpoints

### Health & System

| Method | Path                    | Auth   | Description              |
| ------ | ----------------------- | ------ | ------------------------ |
| GET    | `/api/health`           | Public | System health check      |
| GET    | `/api/health/counts`    | Owner  | Entity counts            |
| GET    | `/api/admin/backups`    | Owner  | List backups             |
| POST   | `/api/admin/backups`    | Owner  | Create backup            |
| POST   | `/api/admin/restore`    | Owner  | Restore from backup      |

### Auth

| Method | Path                          | Auth   | Description         |
| ------ | ----------------------------- | ------ | ------------------- |
| POST   | `/api/auth/register`          | Public | Register new user   |

### Billing

| Method | Path                          | Auth   | Description         |
| ------ | ----------------------------- | ------ | ------------------- |
| GET    | `/api/billing/plans`          | Owner  | Available plans     |
| GET    | `/api/billing/subscription`   | Owner  | Current subscription|
| POST   | `/api/billing/subscribe`      | Owner  | Change plan         |
| POST   | `/api/billing/cancel`         | Owner  | Cancel subscription |
| POST   | `/api/billing/renew`          | Owner  | Renew subscription   |
| GET    | `/api/billing/payments`       | Owner  | Payment history     |

### Sales

| Method | Path                          | Auth   | Description         |
| ------ | ----------------------------- | ------ | ------------------- |
| GET    | `/api/sales`                  | Auth   | List sales          |
| POST   | `/api/sales`                  | Auth   | Create sale         |
| GET    | `/api/sales/[id]`             | Auth   | Sale details        |
| PATCH  | `/api/sales/[id]`             | Auth   | Void sale           |

### Other

| Method | Path                    | Auth   | Description              |
| ------ | ----------------------- | ------ | ------------------------ |
| GET    | `/api/reports/*`        | Owner  | Report endpoints         |
| GET    | `/api/products`         | Auth   | List products            |
| GET    | `/api/categories`       | Auth   | List categories          |
| GET    | `/api/customers`        | Auth   | List customers           |
| GET    | `/api/inventory`        | Auth   | List inventory           |

## Backups

### Create a backup

```bash
curl -X POST http://localhost:3000/api/admin/backups \
  -H "Cookie: <session-cookie>"
```

### List backups

```bash
curl http://localhost:3000/api/admin/backups \
  -H "Cookie: <session-cookie>"
```

### Restore

```bash
curl -X POST http://localhost:3000/api/admin/restore \
  -H "Cookie: <session-cookie>" \
  -H "Content-Type: application/json" \
  -d '{"data": { "User": [...], "Store": [...] }}'
```

## Backup & Restore (Manual)

### PostgreSQL Dump

```bash
# Backup
pg_dump retailpos > retailpos-backup-$(date +%Y%m%d).sql

# Restore
psql retailpos < retailpos-backup-20250101.sql
```

## Updating

```bash
git pull
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart retailpos
```

## Troubleshooting

### Database connection failed

- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure PostgreSQL accepts connections (check pg_hba.conf)

### Build fails with TypeScript errors

```bash
npx prisma generate
npm run build
```

### Login not working

- Ensure database has been migrated (`npx prisma migrate dev`)
- Check AUTH_SECRET is set
- Clear browser cookies and try again

## License

Private — All rights reserved.
#   R e t a i l P O S  
 