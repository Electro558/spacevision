# Admin Console Enhancement — Design Spec

**Date:** 2026-04-01
**Status:** Approved (Rev 2 — post-review fixes)

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

**Route protection:**
- **Middleware** (`/admin/:path*`): Authentication-only gating — checks if user is logged in (cookie present). Redirects to login if not. Does NOT check admin role (edge middleware cannot do DB lookups due to Vercel size limits).
- **Layout** (`admin/layout.tsx`): Authorization — server component checks if `session.user.email` is in the admin emails list. Redirects non-admins to `/`.
- **API routes**: Each admin API endpoint independently verifies admin email server-side.

**Admin email list:** Stored in `SystemSettings` table. `coolbanana558@gmail.com` is always admin (hardcoded fallback even if DB is empty).

---

## Section 1: Dashboard (Analytics)

### Stats Cards (top row, 4 cards)
- **Total Users** — count + delta today (e.g., "+3 today")
- **Premium Users** — count + conversion rate percentage
- **Total Models** — count of all SavedModel records
- **AI Generations** — total today from GenerationLog table

### Charts (Recharts library)

1. **Signups over time** — line chart, grouped by day
2. **AI generations over time** — bar chart, grouped by day (from GenerationLog)
3. **Plan distribution** — pie chart (Free vs Premium counts)
4. **Top users by models** — horizontal bar chart, top 10 users

### Filter Bar
Date range preset buttons: **7d | 30d | 90d | All**. Applies to all time-series charts simultaneously.

### API Endpoint
`GET /api/admin/analytics?range=7d|30d|90d|all`

Data sources:
- Signups: group User.createdAt by day
- Generations: group GenerationLog.createdAt by day (new table — see Schema section)
- Models: group SavedModel.createdAt by day
- Plan distribution: count User by plan
- Top users: count SavedModel grouped by userId, top 10

---

## Section 2: User Management

### Enhanced User Table
Columns: Avatar + Name + Email | Plan (badge) | Models | Generations Today | Status | Joined | Actions

**Search:** Text input filtering by name or email. Initial implementation uses client-side filtering. Note: should migrate to server-side search with pagination as user count grows.

**Filters:** Dropdowns for:
- Plan: All / Free / Premium
- Status: All / Active / Suspended / Banned

### Per-User Actions (dropdown menu)
- **Toggle plan** — switch Free ↔ Premium (existing functionality)
- **Suspend** — soft ban. User can log in but sees "account suspended" message. Feature APIs return 403. Requires confirmation dialog.
- **Ban** — hard ban. User blocked at login entirely (signIn callback rejects). Requires confirmation dialog.
- **Unsuspend / Unban** — reverse suspension or ban.
- **Reset password** — clears password hash. Only available for users with at least one linked OAuth account. Button hidden/disabled for credentials-only users (no OAuth accounts linked).
- **Impersonate** — browse the app as that user.

### Schema Changes
Add to User model:
```prisma
status    String   @default("ACTIVE") // ACTIVE | SUSPENDED | BANNED
```

Using String instead of enum for flexibility (no migration needed to add new statuses). This is an intentional deviation from the Plan enum pattern — status values may expand (e.g., PENDING_REVIEW) without requiring schema migrations.

### Auth Integration
- **signIn callback:** Check user status. If `BANNED`, return `false` (blocked from login). `SUSPENDED` users can sign in.
- **Feature API middleware pattern:** Check user status. If `SUSPENDED`, return 403 with message "Your account has been suspended."
- **Enforcement points:** Generate route, Models routes, Export routes — add status check at top of handlers.

### Impersonation

**Approach:** Store impersonation state inside the existing signed JWT token (not a separate cookie). This keeps everything within NextAuth's signing/encryption.

- Admin clicks "Impersonate" → calls `POST /api/admin/impersonate` with target userId
- Server validates admin, then calls NextAuth's session update to add `impersonatingUserId` and `impersonatingUserName` to the JWT token
- The `jwt` callback checks for `impersonatingUserId` — if present, resolves session data (id, plan, email) from that user instead of the admin
- App checks for `impersonatingUserId` in the session and shows a fixed banner: "Viewing as [userName] — [Exit Impersonation]"
- "Exit" calls `POST /api/admin/impersonate/exit` which triggers a session update to clear the impersonation fields
- The admin's real identity is always preserved in the token (`token.userId` stays the admin's ID, `token.impersonatingUserId` is the target)

**JWT token shape when impersonating:**
```ts
{
  userId: "admin-id",           // real admin, never changes
  impersonatingUserId: "target-id",  // who we're viewing as
  impersonatingUserName: "Target Name",
  plan: "FREE",                 // target's plan
  emailVerified: Date,          // target's emailVerified
}
```

### API Endpoints
- `PATCH /api/admin/users` — plan toggle only (no status changes)
- `POST /api/admin/users/[id]/suspend` — set status to SUSPENDED
- `POST /api/admin/users/[id]/ban` — set status to BANNED
- `POST /api/admin/users/[id]/activate` — set status to ACTIVE
- `POST /api/admin/users/[id]/reset-password` — clear password hash (guarded: requires OAuth account)
- `POST /api/admin/impersonate` — start impersonation (updates JWT)
- `POST /api/admin/impersonate/exit` — end impersonation (clears JWT fields)

---

## Section 3: Content Moderation (Models)

### Models Table
Columns: Checkbox | Thumbnail (small image) | Model Name | Creator (name + email) | Objects Count | Created | Actions

**Search:** Text input filtering by model name or creator email (server-side).

**Sort:** By date (newest/oldest), by creator name.

**Pagination:** 20 models per page. Response shape: `{ models: [...], total: number, page: number, pageSize: number, totalPages: number }`.

### Thumbnail Handling
The `thumbnail` field stores base64 data URIs which can be large. The models list endpoint omits the `thumbnail` field and returns only a `hasThumbnail: boolean` flag. A placeholder image is shown for models with thumbnails. The full thumbnail is loaded on-demand when the preview modal is opened via `GET /api/admin/models/[id]`.

### Thumbnail Preview Modal
Clicking a row opens a modal showing:
- Full thumbnail image (loaded on demand)
- Model metadata: name, description, created date, updated date
- Creator info: name, email, plan
- Scene data summary: number of objects, list of object types used
- **Delete button** with confirmation dialog

### Bulk Actions
- Checkbox column for multi-select
- Bulk delete button with confirmation ("Delete X selected models?")

### API Endpoints
- `GET /api/admin/models?search=&sort=&page=&pageSize=20` — paginated model list (thumbnails omitted)
- `GET /api/admin/models/[id]` — single model with full thumbnail
- `POST /api/admin/models/bulk-delete` — bulk delete (body: `{ ids: string[] }`) — uses POST to reliably pass body
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

| Setting Key | Default | Description | Enforcement Point |
|---|---|---|---|
| `disable_registration` | false | Block new account creation | `/api/register` route, `/register` page |
| `maintenance_mode` | false | Show maintenance page to non-admins | Root layout checks setting, renders maintenance page |
| `disable_ai_generation` | false | Disable AI generation globally | `/api/generate` route |
| `disable_credentials_auth` | false | Disable email/password, OAuth only | `/api/register` route, `/login` page hides form, signIn callback rejects credentials |

### Admin Email Management
- List of current admin emails with remove button per email
- Input to add new admin email
- `coolbanana558@gmail.com` is permanent and cannot be removed (shown with lock icon)
- **Cannot remove your own email** — remove button disabled for the currently-logged-in admin's email

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
- Returns hardcoded defaults when key is not in DB (no seeding needed)

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
- `POST /api/admin/settings/admins/remove` — remove admin email (body: `{ email: string }`) — uses POST to reliably pass body

---

## Audit Logging

All destructive admin actions are logged to an `AuditLog` table for accountability.

### Schema
```prisma
model AuditLog {
  id        String   @id @default(cuid())
  adminId   String
  action    String   // e.g., "ban_user", "delete_model", "change_plan", "impersonate"
  targetId  String?  // userId or modelId affected
  metadata  String?  // JSON — additional context
  createdAt DateTime @default(now())

  admin     User     @relation(fields: [adminId], references: [id])
}
```

### Logged Actions
- `change_plan` — plan toggle (metadata: `{ from, to }`)
- `suspend_user`, `ban_user`, `activate_user` — status changes
- `reset_password` — password reset
- `impersonate_start`, `impersonate_end` — impersonation
- `delete_model`, `bulk_delete_models` — content deletion (metadata: `{ modelIds }`)
- `update_setting` — settings changes (metadata: `{ key, from, to }`)
- `add_admin`, `remove_admin` — admin email changes

### Utility
```ts
async function logAdminAction(adminId: string, action: string, targetId?: string, metadata?: object)
```

Called in every admin API mutation handler.

---

## Schema Summary — New/Modified Models

### New: GenerationLog
```prisma
model GenerationLog {
  id        String   @id @default(cuid())
  userId    String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

One row per AI generation. Inserted in the generate route alongside the existing dailyGenerations counter. Used for analytics time-series.

### New: SystemSettings
```prisma
model SystemSettings {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}
```

### New: AuditLog
```prisma
model AuditLog {
  id        String   @id @default(cuid())
  adminId   String
  action    String
  targetId  String?
  metadata  String?
  createdAt DateTime @default(now())

  admin     User     @relation(fields: [adminId], references: [id])
}
```

### Modified: User
```prisma
// Add field:
status    String   @default("ACTIVE") // ACTIVE | SUSPENDED | BANNED

// Add relations:
generationLogs GenerationLog[]
auditLogs      AuditLog[]
```

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
  users/route.ts          — existing (plan toggle only)
  users/[id]/
    suspend/route.ts
    ban/route.ts
    activate/route.ts
    reset-password/route.ts
  models/route.ts         — paginated model list + bulk delete
  models/[id]/route.ts    — single model operations
  impersonate/route.ts    — start impersonation
  impersonate/exit/route.ts — end impersonation
  settings/route.ts       — get/update settings
  settings/admins/route.ts    — list + add admin emails
  settings/admins/remove/route.ts — remove admin email

src/lib/settings.ts       — settings service with caching
src/lib/auditLog.ts       — audit logging utility
src/components/
  AdminSidebar.tsx        — sidebar nav component
  ImpersonationBanner.tsx — "Viewing as X" banner
```

## Dependencies
- `recharts` — charting library for analytics dashboard
- No other new dependencies needed

## Migration
- Add `status` field to User model (default: "ACTIVE")
- Add `GenerationLog` model
- Add `SystemSettings` model
- Add `AuditLog` model
- Add relations from User to GenerationLog and AuditLog
