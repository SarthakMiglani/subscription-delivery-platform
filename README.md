# Juice Subscription & Delivery Platform — Backend

A production-style Spring Boot backend for a subscription-based juice delivery service. Covers the full operational lifecycle: customer onboarding, subscription management, nightly order generation, delivery execution, wallet ledger accounting, and admin operations — all built with strict transactional correctness, idempotent schedulers, and append-only financial records.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot 3.3 |
| Security | Spring Security (stateless JWT) |
| Persistence | Spring Data JPA + Hibernate 6 |
| Database | PostgreSQL 15 |
| Migrations | Flyway |
| Build | Maven |
| JWT | JJWT 0.12.6 |
| Google Auth | Google API Client 2.7 |
| API Docs | SpringDoc OpenAPI (Swagger UI) |
| Testing | JUnit 5 + Testcontainers (PostgreSQL) |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    REST Controllers                      │
│  Auth · Customer · Onboarding · Subscription · Order    │
│  Wallet · Product · Admin (Orders/Wallet/Products/...)  │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                    Service Layer                         │
│  AuthService · CustomerService · SubscriptionService    │
│  OrderGenerationService · OrderFreezeService            │
│  DeliveryService · OrderCorrectionService               │
│  WalletService · ProductService · AuditLogService       │
│  DeliverySheetService · BusinessHolidayService          │
│  SubscriptionActivationService · NotificationService    │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              Repositories (Spring Data JPA)             │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              PostgreSQL 15 (Flyway migrations)          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  Nightly Schedulers (IST)               │
│  22:00 OrderFreezeJob                                   │
│  22:04 SubscriptionActivationJob                        │
│  22:05 OrderGenerationJob                               │
│  22:10 DeliverySheetGenerationJob                       │
└─────────────────────────────────────────────────────────┘
```

Key design principles:
- **Stateless JWT authentication** — no server-side session state
- **Append-only wallet ledger** — balance is never stored as a mutable column; every financial event inserts a new row
- **Idempotent schedulers** — all nightly jobs are safe to rerun; duplicate orders and delivery records are prevented by idempotency keys and DB constraints
- **Startup recovery** — on boot, the previous 3 calendar days are checked and any missed scheduler jobs are rerun in chronological order
- **Transactional financial operations** — delivery confirmation + wallet debit happen in a single ACID transaction with pessimistic row locking
- **PostgreSQL native enums** — all status fields use `CREATE TYPE ... AS ENUM` with `@JdbcTypeCode(SqlTypes.NAMED_ENUM)`

---

## Database Schema

Flyway migrations, applied in ascending version order (version numbers are not
contiguous — Flyway only requires strictly increasing order, not consecutive
numbers):

| Migration | Table / Change |
|---|---|
| V1 | All PostgreSQL enum types |
| V2 | `users` |
| V6 | `products` |
| V7 | `product_price_history` |
| V8 | `admin_credentials` |
| V9 | `refresh_tokens` |
| V10 | `delivery_addresses` |
| V11 | Seed test customer (dev/test convenience — not removed; harmless in prod) |
| V12 | `subscriptions` |
| V13 | `orders` |
| V14 | `wallet_ledger` |
| V15 | `delivery_records` |
| V16 | `scheduler_job_log` |
| V100 | Seed admin user (default test password — see "Admin Password" below) |
| V101 | Add `HISTORICAL_CORRECTION_DEBIT` source type |
| V102 | `admin_audit_log` |
| V103 | `business_holidays` |
| V104 | `delivery_sheet_snapshots` |
| V105 | `recharge_request_log` |
| V106 | `subscription_change_requests` |
| V107 | Add `ADJUSTMENT` wallet entry type |
| V108 | `ingredients`, `product_ingredients` (recipe/shopping-list feature) |
| V109 | Missing FK indexes |
| V110 | `admin_notifications` |
| V111 | `admin_notifications` — nullable `customer_id`/`customer_name` (system-level events) |

---

## API Reference

Base URL: `/api/v1`

### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/customer/google` | None | Customer Google login — issues JWT + refresh token |
| POST | `/auth/customer/refresh` | None | Rotate customer refresh token |
| POST | `/auth/admin/login` | None | Admin phone + password login |
| POST | `/auth/admin/refresh` | None | Rotate admin refresh token |
| POST | `/auth/logout` | JWT | Revoke refresh token |

### Customer

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/onboarding` | Customer JWT | Complete onboarding (phone + address) |
| GET | `/customer/me` | Customer JWT | Get profile, address, and wallet summary |
| PUT | `/customer/address` | Customer JWT | Update delivery address immediately |

### Products

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/products` | Customer JWT | List available products |

### Subscriptions

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/subscriptions` | Customer JWT | Create subscription |
| GET | `/subscriptions` | Customer JWT | List my subscriptions |
| GET | `/subscriptions/{id}` | Customer JWT | Get subscription detail with pending changes |
| POST | `/subscriptions/{id}/pause` | Customer JWT | Pause subscription |
| POST | `/subscriptions/{id}/resume` | Customer JWT | Resume subscription |
| POST | `/subscriptions/{id}/cancel` | Customer JWT | Cancel subscription |
| POST | `/subscriptions/{id}/change-quantity` | Customer JWT | Submit quantity change request |
| POST | `/subscriptions/{id}/change-product` | Customer JWT | Submit product change request |
| GET | `/subscriptions/{id}/change-requests` | Customer JWT | List change request history |

### Orders

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/orders` | Customer JWT | List my orders |

### Wallet

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/wallet` | Customer JWT | Get wallet balance and summary |
| GET | `/wallet/ledger` | Customer JWT | Get ledger history |
| POST | `/wallet/recharge-request` | Customer JWT | Request wallet top-up (rate-limited: 1/hour) |

### Admin — Products

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/admin/products` | Admin JWT | List all products (including disabled) |
| POST | `/admin/products` | Admin JWT | Create product |
| PUT | `/admin/products/{id}` | Admin JWT | Update product |
| POST | `/admin/products/{id}/disable` | Admin JWT | Disable product (auto-pauses subscriptions) |
| POST | `/admin/products/{id}/enable` | Admin JWT | Re-enable product |

### Admin — Orders

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/admin/orders/{id}/deliver` | Admin JWT | Mark order delivered (atomic wallet debit) |
| POST | `/admin/orders/{id}/skip` | Admin JWT | Mark order skipped |
| PATCH | `/admin/orders/{id}` | Admin JWT | Historical correction (DELIVERED↔SKIPPED, LOCKED→CANCELLED) |

### Admin — Wallet

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/admin/customers/{id}/wallet/credit` | Admin JWT | Credit customer wallet |

### Admin — Holidays

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/admin/holidays` | Admin JWT | List business holidays |
| POST | `/admin/holidays` | Admin JWT | Add holiday |
| DELETE | `/admin/holidays/{id}` | Admin JWT | Delete future holiday |

### Admin — Delivery Sheets

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/admin/delivery-sheets/{date}` | Admin JWT | Get delivery sheet snapshot |
| GET | `/admin/delivery-sheets/{date}/download/csv` | Admin JWT | Download CSV |
| GET | `/admin/delivery-sheets/{date}/download/pdf` | Admin JWT | Download PDF |
| POST | `/admin/delivery-sheets/{date}/regenerate` | Admin JWT | Regenerate snapshot |

### Admin — Scheduler

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/admin/scheduler/freeze` | Admin JWT | Manually rerun OrderFreezeJob |
| POST | `/admin/scheduler/generate` | Admin JWT | Manually rerun OrderGenerationJob |
| POST | `/admin/scheduler/delivery-sheet` | Admin JWT | Manually rerun DeliverySheetGenerationJob |
| GET | `/admin/scheduler/history` | Admin JWT | View scheduler job history |

### Admin — Audit Logs

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/admin/audit-logs` | Admin JWT | Browse audit log entries |

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` or `/api/v1/health` | None | Health check |

---

## Scheduler Workflows

All schedulers run in Asia/Kolkata (IST) timezone.

```
22:00  OrderFreezeJob
       SCHEDULED orders → LOCKED
       Creates delivery_record(PENDING) per order

22:04  SubscriptionActivationJob
       PENDING_START subscriptions with start_date ≤ today → ACTIVE

22:05  OrderGenerationJob
       Runs SubscriptionActivation first (BR-ORD-07)
       For each ACTIVE subscription:
         - Applies APPROVED change requests (quantity/product)
         - Checks wallet balance
         - Creates SCHEDULED order with address + price snapshot

22:10  DeliverySheetGenerationJob
       Builds snapshot from LOCKED orders with PENDING delivery_records
       Stores as JSONB in delivery_sheet_snapshots
```

### Startup Recovery (BR-SCH-04)

On every application startup, the previous 3 calendar days are inspected. Any missed or failed jobs are rerun in chronological order, per day in sequence:

```
SubscriptionActivationJob → OrderGenerationJob → OrderFreezeJob → DeliverySheetGenerationJob
```

All recovery runs are fully idempotent — no duplicate orders, delivery records, or snapshots are created.

---

## Subscription Change Requests

Customers can schedule future changes to their subscriptions:

- **Quantity change** — takes effect on the next order generation after the effective date
- **Product change** — validated against product availability; takes effect on the next order generation

Rules:
- Requests are inserted directly as `APPROVED` (no pending state)
- Submitting a new request of the same type supersedes the previous `APPROVED` request
- One `APPROVED` quantity request and one `APPROVED` product request can coexist
- The scheduler applies `APPROVED` requests during `OrderGenerationJob` and marks them `APPLIED`
- If a `SCHEDULED` order already exists for the target date, it is updated inline before lock time

---

## Financial Integrity

- All monetary values stored as `BIGINT` in paise (₹1 = 100 paise)
- Wallet balance is never stored as a mutable column — computed from the latest `running_balance_paise` in `wallet_ledger`
- Every financial event inserts a new ledger row (append-only)
- Delivery confirmation + wallet debit are a single ACID transaction
- Pessimistic write lock (`SELECT FOR UPDATE`) on the latest ledger row before any balance mutation prevents concurrent double-deductions
- Historical corrections insert new ledger entries; existing rows are never modified

---

## Local Setup

### Prerequisites

- Java 21
- Maven 3.9+
- Docker (for PostgreSQL)

### 1. Clone

```bash
git clone <repo-url>
cd juice-platform
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

This starts PostgreSQL 15 on port `5433` with:
- Database: `juice_platform`
- User: `juice_user`
- Password: `juice_password`

### 3. Set Environment Variables

```bash
export JWT_SECRET="your-secret-key-at-least-32-characters-long"
export GOOGLE_CLIENT_ID="your-google-oauth-client-id"
```

### 4. Run the Backend

```bash
cd backend
mvn spring-boot:run
```

The server starts on `http://localhost:8080`.

To enable dev token endpoints (for local testing without Google OAuth):

```bash
SPRING_PROFILES_ACTIVE=dev mvn spring-boot:run
```

> **Warning:** Never set `SPRING_PROFILES_ACTIVE=dev` in production. The `dev` profile exposes unauthenticated token generation endpoints at `/api/v1/dev/token/customer` and `/api/v1/dev/token/admin`.

### 5. Swagger UI

```
http://localhost:8080/swagger-ui.html
```

---

## Running Tests

Tests use Testcontainers — Docker must be running.

```bash
cd backend
mvn test
```

**212 tests, 0 failures** (last verified run).

Test classes:

| Class | Coverage |
|---|---|
| `AuthServiceTest` | — |
| `CustomerServiceTest` | GET /me, PUT /address, address snapshot immutability |
| `SubscriptionServiceTest` | Create, pause, resume, cancel, ownership |
| `SubscriptionChangeRequestServiceTest` | Quantity/product changes, superseding, scheduler application |
| `OrderCorrectionServiceTest` | Historical corrections, auto-refund, negative balance |
| `DeliveryServiceTest` | Mark delivered/skipped, idempotency, wallet debit |
| `WalletServiceTest` | Credit, balance, ledger history |
| `WalletLedgerLockingTest` | Pessimistic locking, append-only invariant |
| `WalletRechargeRequestServiceTest` | Rate limiting, no wallet mutation |
| `AuditLogServiceTest` | Audit entries, filter by admin |
| `BusinessHolidayServiceTest` | Add/delete holidays, order generation skip |
| `DeliverySheetServiceTest` | Snapshot generation, rerun, juice summary |
| `ProductDisableAutoPauseTest` | Auto-pause on disable, SCHEDULED orders unchanged |
| `CriticalFixesTest` | Deactivated customer, SCHEDULED order cancellation |
| `AdminSchedulerServiceTest` | Rerun idempotency, job history, audit logging |
| `SchedulerJobLogTrackingTest` | RUNNING guard, COMPLETED/FAILED rerun, rowsProcessed |
| `SchedulerStartupRecoveryTest` | Missed job recovery, idempotency, 3-day window |
| `SecurityConfigTest` | CORS origins, no wildcard, credentials |
| `DevProfileIsolationTest` | DevAuthController absent outside dev profile |

---

## Configuration Reference

### `application.properties`

| Property | Description | Default |
|---|---|---|
| `server.port` | HTTP port | `8080` |
| `spring.datasource.url` | PostgreSQL JDBC URL | `jdbc:postgresql://127.0.0.1:5433/juice_platform` |
| `jwt.secret` | JWT signing secret (env: `JWT_SECRET`) | — |
| `jwt.access-token-expiry-minutes` | Access token TTL | `15` |
| `jwt.refresh-token-expiry-days` | Refresh token TTL | `30` |
| `google.client-id` | Google OAuth client ID (env: `GOOGLE_CLIENT_ID`) | — |
| `app.cors.allowed-origins` | Comma-separated allowed CORS origins | `http://localhost:3000,http://localhost:5173` |
| `scheduler.order-freeze.cron` | OrderFreezeJob cron (IST) | `0 0 22 * * *` |
| `scheduler.subscription-activation.cron` | SubscriptionActivationJob cron (IST) | `0 4 22 * * *` |
| `scheduler.order-generation.cron` | OrderGenerationJob cron (IST) | `0 5 22 * * *` |
| `scheduler.delivery-sheet.cron` | DeliverySheetGenerationJob cron (IST) | `0 10 22 * * *` |

---

## Security Notes

- `spring.profiles.active` is **not** hardcoded in `application.properties`. Set `SPRING_PROFILES_ACTIVE=dev` explicitly for local development only. Never combine it with `SPRING_PROFILES_ACTIVE=prod` — use exactly one.
- CORS origins are configurable via `app.cors.allowed-origins` (`app.cors.allowed-origins` in dev, `APP_CORS_ALLOWED_ORIGINS` in prod). Set to your actual frontend domain(s) in production.
- `JWT_SECRET` and `GOOGLE_CLIENT_ID` must be provided as environment variables. The application will fail to start without them.
- All admin mutations are audit-logged in `admin_audit_log` with before/after JSONB snapshots.

### Admin Password

The seeded admin account (`V100__seed_admin.sql`) has phone `9999999999` and password
`admin123`. This default is kept intentionally for local development and testing — it is
**not** removed from the migration. Migrations are append-only, so the fix is not to edit
that file, but to set the `ADMIN_BOOTSTRAP_PASSWORD` environment variable before starting
the app on any environment where the default password should not be used. On every
startup, `AdminPasswordBootstrap` overwrites the seeded admin's password hash with this
value. Unset the variable again after confirming the new password works — the hash stays
as whatever it was last set to; it does not revert.

```bash
export ADMIN_BOOTSTRAP_PASSWORD="a-real-password-here"
```

---

## Free-Tier Deployment (Render + Supabase + Vercel)

For low-traffic deployments (this was built for ~100 daily customers) where a VPS is
more than needed, the whole stack can run on free tiers: **Supabase** for Postgres,
**Render** for the backend (using the existing `backend/Dockerfile` as-is), and
**Vercel** for both frontends. Total cost: **$0/month**, with two important caveats
covered at the end of this section.

```
┌──────────────┐        ┌──────────────┐
│ Vercel        │        │ Vercel        │
│ (customer PWA)│        │ (admin panel) │
└──────┬────────┘        └──────┬────────┘
       │  HTTPS (VITE_API_URL)  │
       └────────────┬───────────┘
                     ▼
            ┌──────────────────┐
            │  Render (free)   │
            │  Spring Boot API │
            └────────┬─────────┘
                     │  Supavisor Session Pooler (IPv4, port 5432)
                     ▼
            ┌──────────────────┐
            │ Supabase (free)  │
            │   PostgreSQL     │
            └──────────────────┘
```

### 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com) (free tier, 1 project).
2. In the project dashboard, click **Connect** and copy the **Session pooler**
   connection string — not "Direct connection" and not "Transaction pooler".
   - Direct connection is IPv6-only on the free tier; Render's network is IPv4-only,
     so it can't reach it without Supabase's paid IPv4 add-on.
   - The Transaction pooler (port 6543) doesn't support prepared statements, which
     Hibernate and Flyway both rely on — only Session pooler mode (port 5432) does.
3. From that connection string, extract:
   - Host: `aws-0-<region>.pooler.supabase.com`
   - Username: `postgres.<project-ref>`
   - Password: the one you set when creating the project
   - Build the JDBC URL: `jdbc:postgresql://aws-0-<region>.pooler.supabase.com:5432/postgres`

### 2. Deploy the backend to Render

1. Push this repo to GitHub (Render deploys from a Git repo).
2. In the Render Dashboard, choose **New → Blueprint** and point it at the repo —
   Render reads `render.yaml` from the repo root automatically.
3. Render will prompt for every environment variable marked `sync: false` in
   `render.yaml`:

   | Variable | Value |
   |---|---|
   | `SPRING_DATASOURCE_URL` | `jdbc:postgresql://aws-0-<region>.pooler.supabase.com:5432/postgres` |
   | `SPRING_DATASOURCE_USERNAME` | `postgres.<project-ref>` |
   | `SPRING_DATASOURCE_PASSWORD` | your Supabase database password |
   | `JWT_SECRET` | `openssl rand -base64 48` |
   | `GOOGLE_CLIENT_ID` | your Google OAuth client ID |
   | `APP_CORS_ALLOWED_ORIGINS` | your two Vercel URLs once you have them (step 3) — you can redeploy this later once Vercel gives you the URLs |
   | `ADMIN_BOOTSTRAP_PASSWORD` | a real admin password (recommended — see "Admin Password" above) |

4. Deploy. Render builds `backend/Dockerfile` and starts the service on the **free**
   plan. First boot runs Flyway migrations against Supabase automatically.
5. Confirm it's live: `curl https://<your-service>.onrender.com/api/v1/health`
   should return `{"success":true,"data":{"status":"UP","db":"UP"}}`.

### 3. Deploy both frontends to Vercel

For each of `frontend/admin` and `frontend/customer`:

1. In the Vercel Dashboard, **Add New → Project**, import the repo, and set the
   project's **Root Directory** to `frontend/admin` (or `frontend/customer`).
   Vercel auto-detects the Vite framework preset — no build command changes needed.
2. Under **Environment Variables**, add:
   - `VITE_API_URL` = `https://<your-render-service>.onrender.com/api/v1`
   - `VITE_MOCK` = `false`
   - Customer app only: `VITE_GOOGLE_CLIENT_ID` = your Google OAuth client ID
3. Deploy. Vercel gives you a `*.vercel.app` URL for each app.
4. Go back to Render and update `APP_CORS_ALLOWED_ORIGINS` with both real Vercel
   URLs (comma-separated), then redeploy the backend so CORS actually allows
   requests from them.
5. In Google Cloud Console, add both Vercel URLs as authorized JavaScript origins
   for your OAuth client (Google rejects sign-in requests from unlisted origins).

### 4. Set up the keep-alive ping

Render's free web service spins down after 15 minutes with no inbound traffic, and
Supabase's free database pauses after 7 days with no activity. `.github/workflows/keep-alive.yml`
pings `/api/v1/health` (which itself runs a real DB query) every 10 minutes to prevent
both:

1. In your GitHub repo, go to **Settings → Secrets and variables → Actions → Variables**.
2. Add a repository variable named `BACKEND_HEALTH_URL` set to
   `https://<your-render-service>.onrender.com/api/v1/health`.
3. The workflow is already scheduled (`*/10 * * * *`) — no further setup needed.
   You can trigger it manually from the Actions tab to confirm it works.

### Known limitations of this free-tier setup

Read this before relying on it for anything real:

- **The keep-alive ping is a workaround, not an official feature.** Render does not
  guarantee that an external pinger keeps a free instance permanently warm, and could
  change spin-down behavior at any time. If a nightly job is ever found to have not
  run — check **Admin Dashboard → Scheduler → History**, or `GET /admin/scheduler/history` —
  that's a sign this setup is no longer reliable enough and the backend should move to
  a paid Render plan (Starter, ~$7/month) or a persistent-VM alternative (Oracle Cloud's
  Always Free tier is a genuinely free, non-expiring, no-spin-down option, though it
  requires the VPS-style Docker Compose setup documented below instead of this one).
- **GitHub Actions disables scheduled workflows after 60 days with no commits to the
  repo.** If the repo goes quiet for two months, the keep-alive ping silently stops. A
  free external cron service (e.g. [cron-job.org](https://cron-job.org)) pinging the
  same health URL is a backup that doesn't depend on repo activity — consider setting
  one up in addition to the GitHub Action.
- **Render's free plan caps usage at 750 instance-hours per workspace per month.** One
  service running continuously for a 31-day month uses almost exactly that. If you add
  any other free Render service to the same account, you will exceed the cap and
  Render suspends services until the next month.
- **Cold starts still happen occasionally.** Even with the ping, a slow GitHub Actions
  scheduler tick or a Render platform hiccup can leave a ~1-minute gap where the first
  real user request of the day is slow. This is a UX inconvenience, not a correctness
  issue, as long as the 22:00 IST scheduler window itself was covered by a ping.
- **Free Supabase projects are capped at 500MB database storage** and 2 free projects
  per account — more than enough at 100 customers/day, but worth knowing if usage grows.

---

## Production Deployment (VPS)

The repository ships a complete Docker Compose topology for a single VPS deployment:
Nginx (TLS termination + reverse proxy) in front of the Spring Boot API and the two
static frontend builds (admin dashboard, customer PWA), with PostgreSQL on an internal-
only Docker network (no published port).

```
                    ┌────────────────────────┐
  Internet ── 443 ─▶│   nginx (TLS, proxy)   │
                    └───────────┬────────────┘
                    ┌───────────┼────────────┐
                    ▼           ▼            ▼
              ┌─────────┐ ┌──────────┐ ┌────────────┐
              │   app   │ │  admin   │ │  customer  │
              │(Spring) │ │ (static) │ │  (static)  │
              └────┬────┘ └──────────┘ └────────────┘
                   │
              ┌────▼────┐
              │   db    │  (no published port — internal network only)
              │(Postgres)│
              └─────────┘
```

Files involved: `docker-compose.prod.yml` (root), `backend/Dockerfile`,
`frontend/admin/Dockerfile`, `frontend/customer/Dockerfile`,
`nginx/default.conf.template`, `.env.example`.

### 1. Provision a VPS

Any small VPS works — the original design target was a 2 vCPU / 4 GB RAM instance
(e.g. Hetzner CX21). Install Docker and the Docker Compose plugin. Point two DNS
A records at the server's public IP: one for the customer app domain, one for the
admin domain (e.g. `app.yourdomain.com` and `admin.yourdomain.com`).

### 2. Configure environment variables

```bash
cd /opt/juice-platform   # wherever you've cloned the repo
cp .env.example .env
```

Edit `.env` and fill in every value — see the comments in `.env.example` for what
each variable is and how to generate secrets (`openssl rand -base64 32`, etc.).
**Never commit the real `.env` file.**

### 3. Bootstrap TLS certificates (first run only)

Certificates don't exist yet, so nginx needs to start once in a certificate-less
state to serve the ACME HTTP-01 challenge, then certbot issues the certs, then
nginx is reloaded to pick them up.

```bash
# Start nginx + backing services (nginx will fail its HTTPS server blocks until
# certs exist, but the HTTP-01 challenge location still works).
docker compose -f docker-compose.prod.yml up -d db app admin customer nginx

# Issue certificates for both domains via the webroot challenge.
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  -d app.yourdomain.com -d admin.yourdomain.com \
  --email you@yourdomain.com --agree-tos --no-eff-email

# Reload nginx now that certificates exist on the shared volume.
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### 4. Steady-state deploy / redeploy

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Rerunning this is safe — Flyway migrations are idempotent and the app container
rebuilds only if source changed.

### 5. Certificate renewal

Let's Encrypt certificates expire after 90 days. Add a host crontab entry to renew
and reload nginx periodically:

```cron
0 3 * * 0 cd /opt/juice-platform && docker compose -f docker-compose.prod.yml run --rm certbot renew && docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### 6. Database backups

`backend/backup/backup.sh` runs `pg_dump` inside the running `juice-db` container,
gzips the output, and prunes backups older than 14 days. Schedule it daily:

```cron
0 3 * * * cd /opt/juice-platform && ./backend/backup/backup.sh >> /var/log/juice-backup.log 2>&1
```

To restore a backup (destructive — overwrites the target database):

```bash
gunzip -c backend/backup/juice_platform_2025-01-15_0300.sql.gz | \
  docker exec -i juice-db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

For disaster recovery beyond the local backup files, periodically copy the
`backend/backup/*.sql.gz` files off-server (e.g. to S3-compatible object storage
or another machine) — a backup that only exists on the VPS it's protecting against
doesn't survive that VPS failing.

### 7. Monitoring

No APM/metrics stack is bundled (Spring Boot Actuator is intentionally not a
dependency — see `pom.xml`). For basic uptime monitoring, point an external
service (e.g. UptimeRobot) at `https://app.yourdomain.com/api/v1/health`.

### Production checklist

- [ ] `.env` filled in with real, randomly generated secrets (not the values in `.env.example`)
- [ ] `ADMIN_BOOTSTRAP_PASSWORD` set on first boot, then admin password confirmed working
- [ ] DNS records for both domains point at the server
- [ ] TLS certificates issued (step 3 above)
- [ ] Cron jobs installed for certbot renewal and database backups
- [ ] `APP_CORS_ALLOWED_ORIGINS` matches the real HTTPS domains exactly
- [ ] Google OAuth client configured for the production domain (not localhost)
- [ ] Confirmed `SPRING_PROFILES_ACTIVE=prod` is set and `dev` is never set alongside it

---

## Known Gaps (Not Yet Implemented)

- `POST /api/v1/admin/orders/{id}/confirm-email` — delivery confirmation email trigger (spec Domain 15). No UI or backend endpoint exists yet.
- Email delivery for notifications is not wired to any SMTP provider. Low-balance warnings, order-generation-blocked, wallet-credited, scheduler-failure, product-auto-pause, and subscription-cancelled events are all persisted to the in-app admin notification panel (`admin_notifications` table, visible under Notifications in the admin dashboard) and logged server-side, but no email is sent to customers or admins for any of them yet.
- `subscription_pause_history` (an audit/history table for pause/resume events) described in early design docs was never implemented — this is not functionally required since operational state is fully derived from `subscriptions.status`/`pause_reason`, but there's no dedicated pause/resume audit trail beyond `admin_audit_log`.
- BR-ORD-08 (deferring `PENDING_START` activation itself to the next operational day when the activation date falls on a holiday) is not implemented as a distinct step — in practice the net effect is largely covered because order generation independently skips holidays, but the literal "defer activation" behavior isn't separately coded.

Everything else described in the original design docs — customer CRUD, admin customer/subscription/order/wallet management, delivery sheets (CSV + real PDF), ingredient recipes and shopping lists, scheduler reruns and startup recovery, and historical order corrections including quantity/product price recalculation — is implemented and covered by the test suite.
