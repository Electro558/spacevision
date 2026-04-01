# Admin Console Enhancement — Design Spec

**Date:** 2026-04-01
**Status:** Approved

## Overview

Enhance the existing barebones admin console into a full-featured multi-page admin panel with analytics dashboard, user management (ban/suspend/impersonate), content moderation, and configurable system settings.

## Architecture

### Layout & Routing

Multi-page admin with sidebar navigation:

```
/admin              → redirects to /admin/dashboard
/admin/dashboard    → analytics charts and stats
/admin/users        → user management table
/admin/models       → content moderation
/admin/settings     → system configuration
```

**Shared layout** (`src/app/admin/layout.tsx`):
- Left sidebar (~240px): Shield icon + "Admin" title, nav links with icons (Dashboard, Users, Models, Settings). Active state highlighted in brand color. Collapses to icons-only on mobile.
- Main content area (right): sub-pages render here.
- Server-side admin check in layout — redirects non-admins.

**Navbar integration:** "Admin" link with `ShieldCheck` icon in the main app navbar dropdown. Only visible when `session.user.email` is in the admin emails list. Links to `/admin/dashboard`.

**Route protection:** Middleware extended to protect `/admin/:path*`. All admin API endpoints verify admin email server-side.

**Admin email list:** Stored in `SystemSettings` table. `coolbanana558@gmail.com` is always admin (hardcoded fallback even if DB is empty).

---

## Section 1: Dashboard (Analytics)

### Stats Cards (top row, 4 cards)
- **Total Users** — count + delta today (e.g., "+3 today")
- **Premium Users** — count + conversion rate percentage
- **Total Models** — count of all SavedModel records
- **AI Generations** — sum of dailyGenerations today / this week

### Charts (Recharts library)

1. **Signups over time** — line chart, grouped by day
2. **AI generations over time** — bar chart, grouped by day
3. **Plan distribution** — pie chart (Free vs Premium counts)
4. **Top users by models** — horizontal bar chart, top 10 users

### Filter Bar
Date range preset buttons: **7d | 30d | 90d | All**. Applies to all time-series charts simultaneously.

### API Endpoint
`GET /api/admin/analytics?range=7d|30d|90d|all`

Aggregates from existing User and SavedModel tables:
- Signups: group User.createdAt by day
- Generations: group User.dailyGenerations by User.lastGenerationDate (approximate — tracks per-user last date, not per-generation log)
- Models: group SavedModel.createdAt by day
- Plan distribution: count User by plan
- Top users: count SavedModel grouped by userId, top 10

No separate analytics table needed. All queries hit existing data.

---

## Section 2: User Management

### Enhanced User Table
Columns: Avatar + Name + Email | Plan (badge) | Models | Generations Today | Status | Joined | Actions

**Search:** Text input filtering by name or email (client-side filter on loaded data).

**Filters:** Dropdowns for:
- Plan: All / Free / Premium
- Status: All / Active / Suspended / Banned

### Per-User Actions (dropdown menu)
- **Toggle plan** — switch Free ↔ Premium (existing functionality)
- **Suspend** — soft ban. User can log in but sees "account suspended" message. Feature APIs return 403.
- **Ban** — hard ban. User blocked at login entirely (signIn callback rejects).
- **Unsuspend / Unban** — reverse suspension or ban.
- **Reset password** — clears password hash, forces re-auth via OAuth or new registration.
- **Impersonate** — browse the app as that user.

### Schema Changes
Add to User model:
```prisma
status    String   @default("ACTIVE") // ACTIVE | SUSPENDED | BANNED
```

Using String instead of enum for flexibility (no migration needed to add new statuses).

### Auth Integration
- **signIn callback:** Check user status. If `BANNED`, return `false` (blocked from login). `SUSPENDED` users can sign in.
- **Feature API middleware pattern:** Check user status. If `SUSPENDED`, return 403 with message "Your account has been suspended."
- **Generate route, Models routes:** Add status check at top of handlers.

### Impersonation
- Admin clicks "Impersonate" → calls `POST /api/admin/impersonate` with target userId
- Server stores admin's real userId in a separate cookie (`admin-session`)
- Server creates a new JWT with the target user's data and sets it as the session
- App shows a fixed banner at the top: "Viewing as [userName] — [Exit Impersonation]"
- "Exit" calls `POST /api/admin/impersonate/exit` which restores the admin JWT from the cookie
- No database changes needed — pure JWT/cookie manipulation

### API Endpoints
- `PATCH /api/admin/users` — existing plan toggle (enhanced with status updates)
- `POST /api/admin/users/[id]/suspend` — set status to SUSPENDED
- `POST /api/admin/users/[id]/ban` — set status to BANNED
- `POST /api/admin/users/[id]/activate` — set status to ACTIVE
- `POST /api/admin/users/[id]/reset-password` — clear password hash
- `POST /api/admin/impersonate` — start impersonation
- `POST /api/admin/impersonate/exit` — end impersonation

---

## Section 3: Content Moderation (Models)

### Models Table
Columns: Thumbnail (small image) | Model Name | Creator (name + email) | Objects Count | Created | Actions

**Search:** Text input filtering by model name or creator email.

**Sort:** By date (newest/oldest), by creator name.

### Thumbnail Preview Modal
Clicking a thumbnail opens a modal showing:
- Larger thumbnail image
- Model metadata: name, description, created date, updated date
- Creator info: name, email, plan
- Scene data summary: number of objects, list of object types used
- **Delete button** with confirmation dialog

### Bulk Actions
- Checkbox column for multi-select
- Bulk delete button with confirmation ("Delete X selected models?")

### API Endpoints
- `GET /api/admin/models?search=&sort=&page=` — paginated model list with creator info
- `DELETE /api/admin/models` — bulk delete (body: `{ ids: string[] }`)
- `DELETE /api/admin/models/[id]` — single model delete

---

## Section 4: System Settings

### Feature Limits (number inputs + save button)
| Setting Key | Default | Description |
|---|---|---|
| `free_model_limit` | 5 | Max saved models for free users |
| `free_generation_limit` | 10 | Daily AI generation limit for free users |
| `premium_model_limit` | null | Max saved models for premium (null = unlimited) |
| `premium_generation_limit` | null | Daily AI generation limit for premium (null = unlimited) |

### Feature Toggles (switches)
| Setting Key | Default | Description |
|---|---|---|
| `disable_registration` | false | Block new account creation |
| `maintenance_mode` | false | Show maintenance page to non-admins |
| `disable_ai_generation` | false | Disable AI generation globally |
| `disable_credentials_auth` | false | Disable email/password, OAuth only |

### Admin Email Management
- List of current admin emails with remove button per email
- Input to add new admin email
- `coolbanana558@gmail.com` is permanent and cannot be removed (shown with lock icon)

### Schema
New model:
```prisma
model SystemSettings {
  key       String   @id
  value     String   // JSON-encoded value
  updatedAt DateTime @updatedAt
}
```

### Settings Service (`src/lib/settings.ts`)
- `getSetting(key)` — reads from DB with in-memory cache (5 minute TTL)
- `setSetting(key, value)` — writes to DB, invalidates cache
- `getSettings()` — returns all settings as an object

### Integration with Feature APIs
Existing hardcoded limits in generate route, models route, etc. replaced with:
```ts
const limit = await getSetting("free_generation_limit") ?? 10;
```

### API Endpoints
- `GET /api/admin/settings` — returns all settings
- `PATCH /api/admin/settings` — update one or more settings (body: `{ key: value, ... }`)
- `GET /api/admin/settings/admins` — list admin emails
- `POST /api/admin/settings/admins` — add admin email
- `DELETE /api/admin/settings/admins` — remove admin email

---

## File Structure

```
src/app/admin/
  layout.tsx              — sidebar + admin guard
  page.tsx                → redirect to /admin/dashboard
  dashboard/page.tsx      — analytics charts
  users/page.tsx          — user management table
  models/page.tsx         — content moderation
  settings/page.tsx       — system configuration

src/app/api/admin/
  analytics/route.ts      — dashboard data aggregation
  users/route.ts          — existing (enhanced)
  users/[id]/
    suspend/route.ts
    ban/route.ts
    activate/route.ts
    reset-password/route.ts
  models/route.ts         — model list + bulk delete
  models/[id]/route.ts    — single model operations
  impersonate/route.ts    — start impersonation
  impersonate/exit/route.ts — end impersonation
  settings/route.ts       — get/update settings
  settings/admins/route.ts — admin email management

src/lib/settings.ts       — settings service with caching
src/components/
  AdminSidebar.tsx        — sidebar nav component
  ImpersonationBanner.tsx — "Viewing as X" banner
```

## Dependencies
- `recharts` — charting library for analytics dashboard
- No other new dependencies needed

## Migration
- Add `status` field to User model (default: "ACTIVE")
- Add `SystemSettings` model
- Seed default settings on first load (settings service handles this with defaults)
