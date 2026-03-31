# Auth, Premium Features & Vercel Migration Design

**Date:** 2026-03-31
**Status:** Approved

## Overview

Add user authentication, premium subscription tier with Stripe payments, model persistence, and migrate hosting from GitHub Pages to Vercel for full server-side capabilities.

## Decisions

- **Hosting:** Vercel (free tier) — replaces GitHub Pages static export
- **Auth:** NextAuth.js v5 with Google, GitHub, and Email/Password (with email verification)
- **Database:** Vercel Postgres (Neon) with Prisma ORM
- **Payments:** Stripe Checkout + Billing Portal (test mode) + manual admin toggle
- **Email:** Resend (free tier, 100 emails/day) for verification emails
- **Tiers:** Free and Premium only (Studio/team deferred)

## Section 1: Database Schema & Auth

### Prisma Schema

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?          // hashed with bcrypt, null for OAuth users
  plan          Plan     @default(FREE)
  stripeCustomerId   String?  @unique
  stripeSubscriptionId String?
  dailyGenerations   Int      @default(0)
  lastGenerationDate DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  accounts      Account[]
  sessions      Session[]
  savedModels   SavedModel[]
}

model SavedModel {
  id          String   @id @default(cuid())
  name        String
  description String?
  sceneData   Json              // serializeScene() output
  thumbnail   String?           // base64 or URL
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum Plan {
  FREE
  PREMIUM
}
```

Plus standard NextAuth `Account`, `Session`, and `VerificationToken` tables via `@auth/prisma-adapter`.

### Auth Configuration

- **NextAuth v5** with Prisma adapter
- **Providers:**
  - Google OAuth (client ID + secret)
  - GitHub OAuth (client ID + secret)
  - Credentials (email + password with bcrypt hashing)
- **Email verification:** Users who sign up with email/password receive a verification email via Resend. They cannot use AI generation or save models until verified. OAuth users are auto-verified.
- **Session strategy:** JWT (optimal for Vercel serverless — no DB lookup per request)
- **Middleware:** `src/middleware.ts` protects `/generate` and `/dashboard`, redirecting unauthenticated users to `/login`

### New Pages

- `/login` — Sign in form with Google, GitHub, and email/password tabs
- `/register` — Sign up form with email/password + OAuth buttons
- `/verify-email` — "Check your inbox" page shown after email registration

### Navbar Changes

Replace the mock `isLoggedIn` toggle with real auth state:
- **Logged out:** "Sign In" button linking to `/login`
- **Logged in:** User avatar dropdown with profile, dashboard, and sign out options

## Section 2: Stripe & Premium Gating

### Stripe Checkout Flow

1. User clicks "Upgrade to Premium" → hits `POST /api/stripe/checkout`
2. API creates a Stripe Checkout Session with the Premium price ID
3. User redirected to Stripe's hosted checkout page (test mode — fake cards work)
4. On success, Stripe redirects to `/dashboard?upgraded=true`
5. Stripe fires webhook to `POST /api/stripe/webhook`
6. Webhook handler sets `user.plan = PREMIUM`, stores `stripeCustomerId` and `stripeSubscriptionId`

### Stripe Cancellation Flow

1. User clicks "Manage Subscription" → hits `POST /api/stripe/portal`
2. API creates a Stripe Billing Portal session
3. User manages/cancels on Stripe's hosted portal
4. Webhook receives `customer.subscription.deleted` → sets `user.plan = FREE`

### Manual Admin Toggle

- `PATCH /api/admin/user-plan` — accepts `{ userId, plan }`
- Protected by `ADMIN_SECRET` env var check
- No admin UI needed — curl or Postman for testing

### Feature Gating Table

| Feature | Where Enforced | How |
|---|---|---|
| AI generations (10/day free) | `/api/generate/route.ts` | Check `user.dailyGenerations` + `lastGenerationDate`. Reset count if new day. Reject with 429 if over limit. Premium skips check. |
| Export formats | Client-side + API | OBJ/GLTF buttons show lock icon + "Premium" badge for free users. Click triggers upgrade modal. Server-side export routes also validate plan. |
| Saved models (5 free) | `/api/models` POST handler | Count user's existing models. Reject with 403 if at limit. Premium skips check. |
| Composition recipes | Client-side | Free users see basic recipes. Advanced recipes show lock icon. |

### Pricing Page Update

- Replace three-tier mockup with two real tiers (Free + Premium $12/mo)
- Premium "Get Started" button triggers Stripe Checkout
- Show "Current Plan" badge for logged-in users
- Studio tier displayed as "Coming Soon" greyed out card

### Upgrade Modal

Reusable `<UpgradeModal>` component that appears when free users attempt premium features. Shows benefits and "Upgrade Now" button triggering Stripe Checkout.

## Section 3: Model Persistence & API Routes

### Save/Load Flow

**Saving:**
1. User clicks "Save" in editor toolbar
2. Client calls `serializeScene()` (existing in `cadStore.ts`) for scene JSON
3. Client captures thumbnail via `renderer.domElement.toDataURL()`
4. `POST /api/models` with `{ name, sceneData, thumbnail }`
5. Server validates auth + model count limit → stores in `SavedModel` table

**Loading:**
1. Dashboard shows saved models as cards with thumbnails
2. User clicks a model → navigates to `/generate?modelId=abc123`
3. Generate page fetches `GET /api/models/[id]` on mount
4. Calls `deserializeScene()` (existing) to restore scene into CAD store

**Auto-save:**
- Debounced auto-save every 30 seconds if scene has changed
- Updates existing model record
- Subtle "Saved" / "Saving..." indicator in toolbar

### API Routes

```
POST   /api/models          — Create a new saved model
GET    /api/models          — List current user's models
GET    /api/models/[id]     — Get a specific model
PUT    /api/models/[id]     — Update (rename, save new scene data)
DELETE /api/models/[id]     — Delete a model

POST   /api/stripe/checkout — Create Stripe Checkout session
POST   /api/stripe/portal   — Create Stripe Billing Portal session
POST   /api/stripe/webhook  — Stripe webhook handler

PATCH  /api/admin/user-plan — Manual plan toggle (admin secret protected)
```

All model routes check auth session and scope queries to the current user's ID.

### Dashboard Overhaul

- Replace hardcoded mock data with real data from `GET /api/models`
- Model cards with thumbnail, name, last edited date
- Actions: Open, Rename, Delete
- Empty state: "No models yet — start creating!" with link to `/generate`
- Model count display: "3 / 5 models" (free) or "12 models" (premium)

### Generate Page Changes

- Add "Save" button to toolbar (floppy disk icon)
- Add "Save As" for duplicating
- Show model name in toolbar when loaded from saved model
- Unsaved changes indicator (dot on save button)

## Section 4: Deployment & Migration to Vercel

### Vercel Setup

1. Connect `Electro558/spacevision` GitHub repo to Vercel
2. Remove `output: "export"` from `next.config.ts`
3. Remove `basePath` and `assetPrefix` conditionals
4. Provision Vercel Postgres from dashboard (auto-adds `POSTGRES_*` env vars)

### Environment Variables

```
# Auth
NEXTAUTH_URL=https://spacevision.vercel.app
NEXTAUTH_SECRET=<generated>
GOOGLE_CLIENT_ID=<from-google-console>
GOOGLE_CLIENT_SECRET=<from-google-console>
GITHUB_CLIENT_ID=<from-github-settings>
GITHUB_CLIENT_SECRET=<from-github-settings>

# Database (auto-added by Vercel Postgres)
POSTGRES_URL=...
POSTGRES_PRISMA_URL=...
POSTGRES_URL_NON_POOLING=...

# Stripe (test mode)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...

# Email
RESEND_API_KEY=re_...

# Admin
ADMIN_SECRET=<secret-for-manual-plan-toggle>

# Existing
ANTHROPIC_API_KEY=<existing>
```

### next.config.ts Changes

```ts
// Before (static export for GitHub Pages)
const nextConfig = {
  output: "export",
  basePath: isProd ? "/spacevision" : "",
  assetPrefix: isProd ? "/spacevision/" : "",
};

// After (Vercel handles everything)
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: "lh3.googleusercontent.com" },  // Google avatars
      { hostname: "avatars.githubusercontent.com" }, // GitHub avatars
    ],
  },
};
```

### GitHub Pages Transition

- Keep `.github/workflows/deploy.yml` during transition
- Once Vercel is confirmed working, delete the workflow and disable GitHub Pages
- Update repo description with new Vercel URL

### New Dependencies

```
next-auth@5              — Authentication (beta)
@auth/prisma-adapter     — NextAuth ↔ Prisma bridge
prisma                   — ORM (dev dependency)
@prisma/client           — ORM runtime
bcryptjs                 — Password hashing
@types/bcryptjs          — Types (dev)
stripe                   — Stripe SDK
resend                   — Email sending
```

## Tier Limits Summary

| | Free | Premium ($12/mo) |
|---|---|---|
| AI generations | 10/day | Unlimited |
| Saved models | 5 | Unlimited |
| Export formats | STL only | STL + OBJ + GLTF |
| Composition recipes | Basic | All |
