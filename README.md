# AfrozonAuto Backend

REST API powering the AfrozonAuto platform — a vehicle import marketplace that connects African buyers with US-sourced vehicles. The platform handles the full purchase lifecycle: browsing, sourcing requests, orders, payments (Paystack / Stripe / bank transfer), shipment tracking, and seller listings.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Key Features](#key-features)
- [Authentication Flow](#authentication-flow)
- [Payment Flow](#payment-flow)
- [Database](#database)
- [Scripts](#scripts)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express 5 |
| ORM | Prisma 6 (MongoDB) |
| Dependency Injection | InversifyJS |
| Validation | Joi |
| Auth | JWT + Google OAuth + Apple Sign-In |
| File Uploads | Multer + Cloudinary |
| Payments | Paystack, Stripe, Flutterwave |
| Email | Nodemailer / Resend |
| Caching | Redis / Upstash |
| API Docs | Swagger UI (`/docs`) |

---

## Project Structure

```
src/
├── config/           # App config, DI container, Swagger spec, multer, OAuth
├── controllers/      # Route handlers (thin — delegates to services)
├── services/         # Business logic
├── repositories/     # Prisma data access layer
├── routes/           # Express routers
├── middleware/       # Auth, validation, Cloudinary upload, error handling
├── validation/       # Joi schemas per domain
├── utils/            # ApiError, ApiResponse, asyncHandler, enumUtils, etc.
├── types/            # Custom TypeScript types
├── generated/        # Prisma-generated client (do not edit)
└── server.ts         # Entry point

prisma/
├── schema.prisma     # Data model
└── seed.ts           # Development seed data
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm)
- MongoDB Atlas cluster (or local MongoDB)
- Cloudinary account
- Paystack and/or Stripe account

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd afrozonauto

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.sample .env
# Fill in all required values in .env

# 4. Generate Prisma client
pnpm prisma:generate

# 5. Push schema to database
pnpm prisma:push

# 6. (Optional) Seed development data
pnpm prisma:seed

# 7. Start the development server
pnpm dev
```

---

## Environment Variables

Copy `.env.sample` to `.env` and populate every value. See [.env.sample](.env.sample) for the full list with descriptions.

Key groups:

| Group | Variables |
|---|---|
| App | `PORT`, `NODE_ENV`, `APP_SECRET`, `CORS_ORIGINS` |
| Database | `DATABASE_URL`, `DB_NAME` |
| Auth / JWT | `JWT_SECRET`, `EXPIRES_IN_SHORT`, `EXPIRES_IN_LONG` |
| OTP | `TOKEN_EXPIRY_MINUTES` (default: 5 minutes) |
| Email | `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `RESEND_API_KEY` |
| Cloudinary | `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_SECRET` |
| Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` |
| Apple Sign-In | `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_PRIVATE_KEY` |
| Paystack | `PAYSTACK_SECRET_KEY`, `PAYSTACK_WEBHOOK_SECRET_KEY` |
| Stripe | `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Redis | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| Business Logic | `DEPOSIT_PERCENTAGE` (default: 0.3 = 30%) |

---

## API Documentation

Interactive Swagger docs are available at:

```
http://localhost:3000/docs
```

All endpoints are grouped by domain: Auth, Vehicles, Orders, Payments, Admin, Sellers, Notifications, Sourcing Requests, Payouts, and more.

---

## Key Features

### Buyer Flow
- Browse and search vehicles (API-sourced + seller listings)
- Request custom vehicle sourcing ("Find a Car")
- Create orders with deposit or full-payment options
- Pay via Paystack, Stripe, or bank transfer (evidence upload)
- Track shipment status in real time
- Receive notifications at every order milestone

### Seller Flow
- Submit vehicle listings (4-step form: details → condition → photos/price → contact)
- Listings go through admin review (PENDING_REVIEW → APPROVED / REJECTED)
- Wallet & payout system with bank account management

### Admin Flow
- Dashboard: order stats, revenue, pending actions
- Manage users, orders, payments, vehicles, notifications
- Confirm or reject bank transfer evidence
- Review and approve seller vehicle submissions

---

## Authentication Flow

```
POST /api/auth/register-start   → Check email + send OTP (expires in TOKEN_EXPIRY_MINUTES)
POST /api/auth/verify           → Validate OTP
POST /api/auth/register         → Create account (requires verified OTP)
POST /api/auth/login            → Email + password → JWT tokens
POST /api/auth/google-auth-verify → Google OAuth code → JWT tokens
POST /api/auth/forgot-password  → Send password reset OTP
POST /api/auth/reset-password   → Reset with OTP + new password
POST /api/auth/refresh-token    → Rotate JWT tokens
```

OTPs expire after `TOKEN_EXPIRY_MINUTES` (default 5 minutes). Each new OTP invalidates previous unused ones.

---

## Payment Flow

### Paystack / Stripe
```
POST /api/payments/init                 → Get payment URL
PATCH /api/payments/verify/:reference   → Verify after redirect
POST /api/payments/webhooks/paystack    → Paystack webhook
POST /api/payments/webhooks/stripe      → Stripe webhook
```

### Bank Transfer (manual)
```
POST /api/payments/bank-transfer/initiate   → Create order + payment + upload evidence (multipart)
POST /api/payments/orders/:orderId/evidence → Upload evidence for existing order
PATCH /api/admin/payments/:id/confirm       → Admin confirms → order status updated
PATCH /api/admin/payments/:id/reject        → Admin rejects → buyer can re-upload
```

---

## Database

MongoDB via Prisma. Main collections:

| Collection | Description |
|---|---|
| `users` | Buyers, sellers, admins |
| `profiles` | Extended user profile + KYC |
| `vehicles` | API-sourced and seller-submitted listings |
| `orders` | Full purchase lifecycle |
| `payments` | Paystack / Stripe / bank transfer records |
| `shipments` | Shipment tracking |
| `tokens` | OTP + password reset tokens (with expiry) |
| `notifications` | In-app notifications |
| `sourcing_requests` | "Find a Car" requests |
| `bank_accounts` | Seller payout accounts |
| `withdrawal_requests` | Seller withdrawal records |
| `testimonials` | Customer testimonials |

---

## Scripts

```bash
pnpm dev              # Start development server with hot reload (tsx watch)
pnpm build            # Compile TypeScript → dist/
pnpm start            # Run compiled production build
pnpm prisma:generate  # Regenerate Prisma client after schema changes
pnpm prisma:push      # Push schema to database (no migration files)
pnpm prisma:seed      # Seed development data
pnpm prisma:studio    # Open Prisma Studio (DB GUI)
```
