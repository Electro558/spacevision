# Admin Console Enhancement Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the barebones admin console into a full multi-page admin panel with analytics, user management, content moderation, and system settings.

**Architecture:** Multi-page admin under `/admin` with shared sidebar layout. New Prisma models (GenerationLog, SystemSettings, AuditLog) + User.status field. Recharts for analytics. Settings service with in-memory cache. Impersonation via JWT token fields.

**Tech Stack:** Next.js 15 (app router), Prisma 7 + Neon Postgres, NextAuth v5 (JWT), Recharts, Tailwind CSS, lucide-react icons.

**Spec:** `docs/superpowers/specs/2026-04-01-admin-console-design.md`

---

## Chunk 1: Schema, Migration, and Core Services

### Task 1: Update Prisma schema with new models and fields

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add new models and fields to schema**

Add `status` field to User model, add GenerationLog, SystemSettings, and AuditLog models, and add new relations.

In `prisma/schema.prisma`, add to the User model (after `lastGenerationDate`):

```prisma
status         String         @default("ACTIVE") // ACTIVE | SUSPENDED | BANNED
```

Add relations to User model (after `savedModels`):

```prisma
generationLogs GenerationLog[]
auditLogs      AuditLog[]
```

Add new models at the end of the file:

```prisma
model GenerationLog {
  id        String   @id @default(cuid())
  userId    String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([createdAt])
}

model SystemSettings {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}

model AuditLog {
  id        String   @id @default(cuid())
  adminId   String
  action    String
  targetId  String?
  metadata  String?
  createdAt DateTime @default(now())

  admin     User     @relation(fields: [adminId], references: [id])

  @@index([adminId])
  @@index([createdAt])
}
```

- [ ] **Step 2: Run migration**

```bash
POSTGRES_PRISMA_URL="postgresql://neondb_owner:npg_aLAZrVg4HqY7@ep-plain-wind-a1to3xpm-pooler.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&connect_timeout=15&sslmode=require" npx prisma migrate dev --name admin-console
```

Expected: Migration applies successfully, new tables created.

- [ ] **Step 3: Verify Prisma client generates**

```bash
npx prisma generate
```

Expected: `Generated Prisma Client` message.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add GenerationLog, SystemSettings, AuditLog models and User.status"
```

---

### Task 2: Create settings service with caching

**Files:**
- Create: `src/lib/settings.ts`

- [ ] **Step 1: Create the settings service**

Create `src/lib/settings.ts`:

```ts
import { prisma } from "./prisma";

const DEFAULTS: Record<string, string> = {
  free_model_limit: "5",
  free_generation_limit: "10",
  premium_model_limit: "null",
  premium_generation_limit: "null",
  disable_registration: "false",
  maintenance_mode: "false",
  disable_ai_generation: "false",
  disable_credentials_auth: "false",
};

const SUPER_ADMIN_EMAIL = "coolbanana558@gmail.com";

// In-memory cache with 5-minute TTL
let cache: Record<string, { value: string; expiresAt: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getSetting(key: string): Promise<string> {
  const now = Date.now();
  const cached = cache[key];
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  try {
    const row = await prisma.systemSettings.findUnique({ where: { key } });
    const value = row?.value ?? DEFAULTS[key] ?? "";
    cache[key] = { value, expiresAt: now + CACHE_TTL };
    return value;
  } catch {
    return DEFAULTS[key] ?? "";
  }
}

export async function getSettingNumber(key: string): Promise<number | null> {
  const val = await getSetting(key);
  if (val === "null" || val === "") return null;
  return parseInt(val, 10);
}

export async function getSettingBool(key: string): Promise<boolean> {
  const val = await getSetting(key);
  return val === "true";
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.systemSettings.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  cache[key] = { value, expiresAt: Date.now() + CACHE_TTL };
}

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.systemSettings.findMany();
  const result = { ...DEFAULTS };
  for (const row of rows) {
    result[row.key] = row.value;
    cache[row.key] = { value: row.value, expiresAt: Date.now() + CACHE_TTL };
  }
  return result;
}

export async function getAdminEmails(): Promise<string[]> {
  const val = await getSetting("admin_emails");
  const emails: string[] = val ? JSON.parse(val) : [];
  if (!emails.includes(SUPER_ADMIN_EMAIL)) {
    emails.unshift(SUPER_ADMIN_EMAIL);
  }
  return emails;
}

export async function isAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const admins = await getAdminEmails();
  return admins.includes(email);
}

export function invalidateCache(): void {
  cache = {};
}
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/settings.ts
git commit -m "feat: add settings service with in-memory caching"
```

---

### Task 3: Create audit logging utility

**Files:**
- Create: `src/lib/auditLog.ts`

- [ ] **Step 1: Create the audit log utility**

Create `src/lib/auditLog.ts`:

```ts
import { prisma } from "./prisma";

export async function logAdminAction(
  adminId: string,
  action: string,
  targetId?: string,
  metadata?: object
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        targetId: targetId ?? null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (err) {
    console.error("[AuditLog] Failed to log action:", err);
  }
}
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/auditLog.ts
git commit -m "feat: add audit logging utility for admin actions"
```

---

### Task 4: Add GenerationLog insertion to generate route

**Files:**
- Modify: `src/app/api/generate/route.ts`

- [ ] **Step 1: Add GenerationLog import and insertion**

At the top of `src/app/api/generate/route.ts`, the imports for `auth` and `prisma` already exist. No new imports needed.

In the rate limiting section (around line 312-318), after the `prisma.user.update` call that increments `dailyGenerations`, add a GenerationLog insertion. Find this block:

```ts
      // Increment counter
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          dailyGenerations: isNewDay ? 1 : { increment: 1 },
          lastGenerationDate: now,
        },
      });
    }
```

Add after the closing `}` of the if block (but still inside the try):

```ts
    // Log generation for analytics
    await prisma.generationLog.create({
      data: { userId: session.user.id },
    });
```

Also add the same log for premium users. The current code only enters the `if (user && user.plan === "FREE")` block for free users. Premium users skip the rate limiting. Add the generationLog.create call AFTER the closing `}` of the `if (user && user.plan === "FREE")` block so it runs for ALL authenticated users.

- [ ] **Step 2: Verify build**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/generate/route.ts
git commit -m "feat: log AI generations to GenerationLog for analytics"
```

---

### Task 5: Update middleware to protect admin routes

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: Extend middleware matcher**

In `src/middleware.ts`, update the config matcher to include admin routes:

```ts
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
```

This provides authentication-only gating (checks cookie presence). Authorization (admin email check) happens in the admin layout.

- [ ] **Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: extend middleware to protect admin routes"
```

---

### Task 6: Integrate settings into existing feature APIs

**Files:**
- Modify: `src/app/api/generate/route.ts`
- Modify: `src/app/api/models/route.ts`

- [ ] **Step 1: Update generate route to use settings**

In `src/app/api/generate/route.ts`, add import at top:

```ts
import { getSettingNumber, getSettingBool } from '@/lib/settings';
```

In the POST handler, after the email verification check and before the rate limiting block, add:

```ts
    // Check if AI generation is disabled globally
    const aiDisabled = await getSettingBool("disable_ai_generation");
    if (aiDisabled) {
      return new Response(
        JSON.stringify({ error: "AI generation is temporarily disabled" }),
        { status: 503 }
      );
    }

    // Check user status
    if (user && (user as any).status === "SUSPENDED") {
      return new Response(
        JSON.stringify({ error: "Your account has been suspended" }),
        { status: 403 }
      );
    }
```

Update the rate limit check to use configurable limit. Replace `if (currentCount >= 10)` with:

```ts
    const genLimit = await getSettingNumber("free_generation_limit") ?? 10;
    if (currentCount >= genLimit) {
      return new Response(
        JSON.stringify({
          error: `Daily limit reached (${genLimit}/day). Upgrade to Premium for unlimited.`,
        }),
        { status: 429 }
      );
    }
```

Also need to add `status` to the user select query. Find:

```ts
    select: { plan: true, dailyGenerations: true, lastGenerationDate: true },
```

Change to:

```ts
    select: { plan: true, dailyGenerations: true, lastGenerationDate: true, status: true },
```

- [ ] **Step 2: Update models route to use settings**

In `src/app/api/models/route.ts`, add import at top:

```ts
import { getSettingNumber } from '@/lib/settings';
```

In the POST handler, replace the hardcoded model limit check. Find:

```ts
    if (count >= 5) {
```

Replace with:

```ts
    const modelLimit = await getSettingNumber("free_model_limit") ?? 5;
    if (count >= modelLimit) {
```

Also update the error message:

```ts
        { error: `Free plan limit: ${modelLimit} models. Upgrade to Premium for unlimited.` },
```

- [ ] **Step 3: Verify build**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/generate/route.ts src/app/api/models/route.ts
git commit -m "feat: integrate configurable settings into feature APIs"
```

---

## Chunk 2: Admin Layout, Sidebar, and Dashboard

### Task 7: Create admin layout with sidebar

**Files:**
- Create: `src/components/AdminSidebar.tsx`
- Create: `src/app/admin/layout.tsx`
- Modify: `src/app/admin/page.tsx` (replace with redirect)

- [ ] **Step 1: Create AdminSidebar component**

Create `src/components/AdminSidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Box,
  Settings,
  ShieldCheck,
} from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/models", label: "Models", icon: Box },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 bg-white/[0.02] border-r border-surface-border min-h-[calc(100vh-3.5rem)] p-4 hidden md:block">
      <div className="flex items-center gap-2 mb-8 px-2">
        <ShieldCheck className="w-5 h-5 text-brand" />
        <span className="text-lg font-bold text-white">Admin</span>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand/10 text-brand"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Create admin layout**

Create `src/app/admin/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/settings";
import AdminSidebar from "@/components/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const adminCheck = await isAdmin(session.user.email);
  if (!adminCheck) {
    redirect("/");
  }

  return (
    <div className="flex pt-14">
      <AdminSidebar />
      <main className="flex-1 min-h-[calc(100vh-3.5rem)] p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Replace admin page.tsx with redirect**

Replace the entire content of `src/app/admin/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function AdminPage() {
  redirect("/admin/dashboard");
}
```

- [ ] **Step 4: Verify build**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/components/AdminSidebar.tsx src/app/admin/layout.tsx src/app/admin/page.tsx
git commit -m "feat: add admin layout with sidebar navigation"
```

---

### Task 8: Create analytics dashboard page

**Files:**
- Create: `src/app/admin/dashboard/page.tsx`
- Create: `src/app/api/admin/analytics/route.ts`

- [ ] **Step 1: Install Recharts**

```bash
npm install recharts
```

- [ ] **Step 2: Create analytics API endpoint**

Create `src/app/api/admin/analytics/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "30d";

  const now = new Date();
  let since: Date;
  switch (range) {
    case "7d":
      since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "all":
      since = new Date("2020-01-01");
      break;
    default:
      since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Parallel queries
  const [
    totalUsers,
    premiumUsers,
    totalModels,
    usersToday,
    signups,
    generations,
    modelCreations,
    planDistribution,
    topUsers,
    generationsToday,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { plan: "PREMIUM" } }),
    prisma.savedModel.count(),
    prisma.user.count({
      where: { createdAt: { gte: new Date(now.toISOString().slice(0, 10)) } },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.generationLog.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.savedModel.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.groupBy({
      by: ["plan"],
      _count: true,
    }),
    prisma.savedModel.groupBy({
      by: ["userId"],
      _count: true,
      orderBy: { _count: { userId: "desc" } },
      take: 10,
    }),
    prisma.generationLog.count({
      where: { createdAt: { gte: new Date(now.toISOString().slice(0, 10)) } },
    }),
  ]);

  // Resolve top user names
  const topUserIds = topUsers.map((u) => u.userId);
  const topUserDetails = await prisma.user.findMany({
    where: { id: { in: topUserIds } },
    select: { id: true, name: true, email: true },
  });
  const userMap = Object.fromEntries(topUserDetails.map((u) => [u.id, u]));

  // Group by day helper
  function groupByDay(items: { createdAt: Date }[]): { date: string; count: number }[] {
    const map: Record<string, number> = {};
    for (const item of items) {
      const day = item.createdAt.toISOString().slice(0, 10);
      map[day] = (map[day] || 0) + 1;
    }
    return Object.entries(map).map(([date, count]) => ({ date, count }));
  }

  return NextResponse.json({
    stats: {
      totalUsers,
      premiumUsers,
      totalModels,
      usersToday,
      generationsToday,
      conversionRate: totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0,
    },
    charts: {
      signups: groupByDay(signups),
      generations: groupByDay(generations),
      models: groupByDay(modelCreations),
      planDistribution: planDistribution.map((p) => ({
        plan: p.plan,
        count: p._count,
      })),
      topUsers: topUsers.map((u) => ({
        name: userMap[u.userId]?.name || userMap[u.userId]?.email || u.userId,
        models: u._count,
      })),
    },
  });
}
```

- [ ] **Step 3: Create dashboard page**

Create `src/app/admin/dashboard/page.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Crown,
  Box,
  Zap,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Stats {
  totalUsers: number;
  premiumUsers: number;
  totalModels: number;
  usersToday: number;
  generationsToday: number;
  conversionRate: number;
}

interface Charts {
  signups: { date: string; count: number }[];
  generations: { date: string; count: number }[];
  models: { date: string; count: number }[];
  planDistribution: { plan: string; count: number }[];
  topUsers: { name: string; models: number }[];
}

const RANGES = ["7d", "30d", "90d", "all"] as const;
const PIE_COLORS = ["#6366f1", "#eab308"];

export default function AdminDashboard() {
  const [range, setRange] = useState<string>("30d");
  const [stats, setStats] = useState<Stats | null>(null);
  const [charts, setCharts] = useState<Charts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?range=${range}`)
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setCharts(data.charts);
        setLoading(false);
      });
  }, [range]);

  if (loading || !stats || !charts) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, delta: `+${stats.usersToday} today`, icon: Users, color: "text-brand" },
    { label: "Premium Users", value: stats.premiumUsers, delta: `${stats.conversionRate}% conversion`, icon: Crown, color: "text-yellow-400" },
    { label: "Total Models", value: stats.totalModels, delta: null, icon: Box, color: "text-green-400" },
    { label: "Generations Today", value: stats.generationsToday, delta: null, icon: Zap, color: "text-purple-400" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="p-5 rounded-xl bg-white/[0.02] border border-surface-border">
            <div className="flex items-center justify-between mb-3">
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
            {card.delta && <p className="text-xs text-green-400 mt-0.5">{card.delta}</p>}
          </div>
        ))}
      </div>

      {/* Date Range Filter */}
      <div className="flex gap-2 mb-6">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              range === r
                ? "bg-brand text-white"
                : "bg-white/[0.02] text-gray-400 hover:text-white border border-surface-border"
            }`}
          >
            {r === "all" ? "All Time" : r}
          </button>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Signups Over Time */}
        <div className="p-5 rounded-xl bg-white/[0.02] border border-surface-border">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Signups Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={charts.signups}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 11 }} />
              <YAxis tick={{ fill: "#888", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8 }} />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Generations Over Time */}
        <div className="p-5 rounded-xl bg-white/[0.02] border border-surface-border">
          <h3 className="text-sm font-medium text-gray-400 mb-4">AI Generations Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={charts.generations}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 11 }} />
              <YAxis tick={{ fill: "#888", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8 }} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Plan Distribution */}
        <div className="p-5 rounded-xl bg-white/[0.02] border border-surface-border">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Plan Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={charts.planDistribution}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="count"
                nameKey="plan"
                label={({ plan, count }) => `${plan}: ${count}`}
              >
                {charts.planDistribution.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Users by Models */}
        <div className="p-5 rounded-xl bg-white/[0.02] border border-surface-border">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Top Users by Models</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={charts.topUsers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis type="number" tick={{ fill: "#888", fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fill: "#888", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8 }} />
              <Bar dataKey="models" fill="#22c55e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/app/admin/dashboard/page.tsx src/app/api/admin/analytics/route.ts
git commit -m "feat: add admin analytics dashboard with Recharts"
```

---

## Chunk 3: User Management

### Task 9: Create enhanced user management page and APIs

**Files:**
- Create: `src/app/admin/users/page.tsx`
- Modify: `src/app/api/admin/users/route.ts`
- Create: `src/app/api/admin/users/[id]/suspend/route.ts`
- Create: `src/app/api/admin/users/[id]/ban/route.ts`
- Create: `src/app/api/admin/users/[id]/activate/route.ts`
- Create: `src/app/api/admin/users/[id]/reset-password/route.ts`

- [ ] **Step 1: Update existing users API to include status**

Replace `src/app/api/admin/users/route.ts` entirely:

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/auditLog";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      plan: true,
      status: true,
      emailVerified: true,
      dailyGenerations: true,
      lastGenerationDate: true,
      createdAt: true,
      _count: { select: { savedModels: true, accounts: true } },
    },
  });

  const stats = {
    totalUsers: users.length,
    premiumUsers: users.filter((u) => u.plan === "PREMIUM").length,
    totalModels: users.reduce((sum, u) => sum + u._count.savedModels, 0),
  };

  return NextResponse.json({ users, stats });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, plan } = await req.json();

  if (!userId || !["FREE", "PREMIUM"].includes(plan)) {
    return NextResponse.json({ error: "Invalid userId or plan" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { plan },
    select: { id: true, plan: true },
  });

  await logAdminAction(session.user.id, "change_plan", userId, { from: user.plan, to: plan });

  return NextResponse.json({ user: updated });
}
```

- [ ] **Step 2: Create suspend route**

Create `src/app/api/admin/users/[id]/suspend/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/auditLog";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { status: "SUSPENDED" },
    select: { id: true, status: true },
  });

  await logAdminAction(session.user.id, "suspend_user", id);

  return NextResponse.json({ user });
}
```

- [ ] **Step 3: Create ban route**

Create `src/app/api/admin/users/[id]/ban/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/auditLog";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { status: "BANNED" },
    select: { id: true, status: true },
  });

  await logAdminAction(session.user.id, "ban_user", id);

  return NextResponse.json({ user });
}
```

- [ ] **Step 4: Create activate route**

Create `src/app/api/admin/users/[id]/activate/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/auditLog";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { status: "ACTIVE" },
    select: { id: true, status: true },
  });

  await logAdminAction(session.user.id, "activate_user", id);

  return NextResponse.json({ user });
}
```

- [ ] **Step 5: Create reset-password route**

Create `src/app/api/admin/users/[id]/reset-password/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/auditLog";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check user has at least one OAuth account
  const user = await prisma.user.findUnique({
    where: { id },
    select: { _count: { select: { accounts: true } } },
  });

  if (!user || user._count.accounts === 0) {
    return NextResponse.json(
      { error: "Cannot reset password: user has no linked OAuth accounts" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id },
    data: { password: null },
  });

  await logAdminAction(session.user.id, "reset_password", id);

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 6: Create users management page**

Create `src/app/admin/users/page.tsx`:

```tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  ChevronDown,
  Shield,
  ShieldOff,
  ShieldBan,
  KeyRound,
  Eye,
  ArrowUpDown,
  Loader2,
  Crown,
} from "lucide-react";

interface UserData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  plan: string;
  status: string;
  emailVerified: string | null;
  dailyGenerations: number;
  lastGenerationDate: string | null;
  createdAt: string;
  _count: { savedModels: number; accounts: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users || []);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !search ||
        (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchesPlan = planFilter === "all" || u.plan === planFilter;
      const matchesStatus = statusFilter === "all" || u.status === statusFilter;
      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [users, search, planFilter, statusFilter]);

  const handleAction = async (userId: string, action: string) => {
    setActionMenuId(null);
    setConfirmAction(null);

    let url = "";
    let method = "POST";
    let body: string | undefined;

    switch (action) {
      case "toggle_plan": {
        const user = users.find((u) => u.id === userId);
        const newPlan = user?.plan === "FREE" ? "PREMIUM" : "FREE";
        url = "/api/admin/users";
        method = "PATCH";
        body = JSON.stringify({ userId, plan: newPlan });
        break;
      }
      case "suspend":
        url = `/api/admin/users/${userId}/suspend`;
        break;
      case "ban":
        url = `/api/admin/users/${userId}/ban`;
        break;
      case "activate":
        url = `/api/admin/users/${userId}/activate`;
        break;
      case "reset_password":
        url = `/api/admin/users/${userId}/reset-password`;
        break;
      default:
        return;
    }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (res.ok) {
      // Refresh users
      const data = await fetch("/api/admin/users").then((r) => r.json());
      setUsers(data.users || []);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">Active</span>;
      case "SUSPENDED":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">Suspended</span>;
      case "BANNED":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">Banned</span>;
      default:
        return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-400">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">User Management</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-white/[0.02] border border-surface-border rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-3 py-2 bg-white/[0.02] border border-surface-border rounded-lg text-sm text-white focus:outline-none focus:border-brand"
        >
          <option value="all">All Plans</option>
          <option value="FREE">Free</option>
          <option value="PREMIUM">Premium</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white/[0.02] border border-surface-border rounded-lg text-sm text-white focus:outline-none focus:border-brand"
        >
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="BANNED">Banned</option>
        </select>
      </div>

      <p className="text-sm text-gray-500 mb-4">{filtered.length} users</p>

      {/* Users Table */}
      <div className="rounded-xl border border-surface-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/[0.02] text-gray-400 text-xs uppercase">
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Plan</th>
              <th className="text-left px-4 py-3">Models</th>
              <th className="text-left px-4 py-3">Gens Today</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Joined</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-white/[0.01]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {user.image ? (
                      <img src={user.image} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-brand text-xs font-bold">
                        {(user.name || user.email)[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-white font-medium">{user.name || "—"}</p>
                      <p className="text-gray-500 text-xs">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    user.plan === "PREMIUM"
                      ? "bg-yellow-500/10 text-yellow-400"
                      : "bg-brand/10 text-brand"
                  }`}>
                    {user.plan === "PREMIUM" && <Crown className="w-3 h-3 inline mr-1" />}
                    {user.plan}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-300">{user._count.savedModels}</td>
                <td className="px-4 py-3 text-gray-300">{user.dailyGenerations}</td>
                <td className="px-4 py-3">{statusBadge(user.status)}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="relative">
                    <button
                      onClick={() => setActionMenuId(actionMenuId === user.id ? null : user.id)}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {actionMenuId === user.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-gray-900 border border-surface-border rounded-lg shadow-xl z-50 py-1">
                        <button
                          onClick={() => handleAction(user.id, "toggle_plan")}
                          className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                        >
                          <ArrowUpDown className="w-3.5 h-3.5" />
                          {user.plan === "FREE" ? "Upgrade to Premium" : "Downgrade to Free"}
                        </button>
                        {user.status === "ACTIVE" && (
                          <>
                            <button
                              onClick={() => setConfirmAction({ id: user.id, action: "suspend" })}
                              className="w-full text-left px-3 py-2 text-sm text-yellow-400 hover:bg-white/5 flex items-center gap-2"
                            >
                              <ShieldOff className="w-3.5 h-3.5" />
                              Suspend
                            </button>
                            <button
                              onClick={() => setConfirmAction({ id: user.id, action: "ban" })}
                              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2"
                            >
                              <ShieldBan className="w-3.5 h-3.5" />
                              Ban
                            </button>
                          </>
                        )}
                        {(user.status === "SUSPENDED" || user.status === "BANNED") && (
                          <button
                            onClick={() => handleAction(user.id, "activate")}
                            className="w-full text-left px-3 py-2 text-sm text-green-400 hover:bg-white/5 flex items-center gap-2"
                          >
                            <Shield className="w-3.5 h-3.5" />
                            Activate
                          </button>
                        )}
                        {user._count.accounts > 0 && (
                          <button
                            onClick={() => setConfirmAction({ id: user.id, action: "reset_password" })}
                            className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            Reset Password
                          </button>
                        )}
                        <button
                          onClick={() => handleAction(user.id, "impersonate")}
                          className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Impersonate
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-surface-border rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-white mb-2">
              Confirm {confirmAction.action === "ban" ? "Ban" : confirmAction.action === "suspend" ? "Suspend" : "Reset Password"}
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              {confirmAction.action === "ban"
                ? "This user will be completely blocked from logging in."
                : confirmAction.action === "suspend"
                ? "This user will be able to log in but cannot use features."
                : "This will clear the user's password. They will need to use OAuth to log in."}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white border border-surface-border"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(confirmAction.id, confirmAction.action)}
                className={`px-4 py-2 rounded-lg text-sm text-white ${
                  confirmAction.action === "ban" ? "bg-red-600 hover:bg-red-500" : "bg-yellow-600 hover:bg-yellow-500"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Verify build**

```bash
npx tsc --noEmit
```

- [ ] **Step 8: Commit**

```bash
git add src/app/admin/users/ src/app/api/admin/users/
git commit -m "feat: add user management with ban, suspend, activate, and reset password"
```

---

### Task 10: Add ban/suspend checks to auth and feature APIs

**Files:**
- Modify: `src/lib/auth.ts`

- [ ] **Step 1: Add ban check to signIn callback**

In `src/lib/auth.ts`, update the `signIn` callback. Replace:

```ts
    async signIn({ user, account }) {
      if (account?.provider === "credentials") {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: { password: true },
        });
        if (!dbUser?.password) return false;
      }
      return true;
    },
```

With:

```ts
    async signIn({ user, account }) {
      // Check if user is banned
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email! },
        select: { password: true, status: true },
      });

      if (dbUser?.status === "BANNED") {
        return false;
      }

      if (account?.provider === "credentials") {
        if (!dbUser?.password) return false;
      }
      return true;
    },
```

- [ ] **Step 2: Add status to JWT token**

In the jwt callback, update the initial user load to include status. Find:

```ts
          select: { id: true, plan: true, emailVerified: true },
```

Change to:

```ts
          select: { id: true, plan: true, emailVerified: true, status: true },
```

After `token.emailVerified = dbUser.emailVerified;`, add:

```ts
          token.status = dbUser.status;
```

In the `trigger === "update"` block, find:

```ts
          select: { plan: true, emailVerified: true },
```

Change to:

```ts
          select: { plan: true, emailVerified: true, status: true },
```

After `token.emailVerified = dbUser.emailVerified;` (in the update block), add:

```ts
          token.status = dbUser.status;
```

- [ ] **Step 3: Add status to session callback**

In the session callback, after `session.user.emailVerified = ...`, add:

```ts
        session.user.status = token.status as string;
```

- [ ] **Step 4: Update next-auth type declarations**

In `src/types/next-auth.d.ts`, add `status: string;` to both the Session.user interface and the JWT interface.

- [ ] **Step 5: Verify build**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth.ts src/types/next-auth.d.ts
git commit -m "feat: add ban/suspend checks to auth flow and session"
```

---

## Chunk 4: Content Moderation and Impersonation

### Task 11: Create content moderation page and APIs

**Files:**
- Create: `src/app/admin/models/page.tsx`
- Create: `src/app/api/admin/models/route.ts`
- Create: `src/app/api/admin/models/[id]/route.ts`
- Create: `src/app/api/admin/models/bulk-delete/route.ts`

- [ ] **Step 1: Create admin models list API**

Create `src/app/api/admin/models/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "newest";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { user: { email: { contains: search, mode: "insensitive" as const } } },
          { user: { name: { contains: search, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const orderBy =
    sort === "oldest"
      ? { createdAt: "asc" as const }
      : sort === "creator"
      ? { user: { name: "asc" as const } }
      : { createdAt: "desc" as const };

  const [models, total] = await Promise.all([
    prisma.savedModel.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        sceneData: true,
        user: {
          select: { id: true, name: true, email: true, plan: true },
        },
      },
    }),
    prisma.savedModel.count({ where }),
  ]);

  // Count objects in scene data, omit thumbnails for list view
  const modelsWithMeta = models.map((m) => {
    const sceneArray = Array.isArray(m.sceneData) ? m.sceneData : [];
    return {
      id: m.id,
      name: m.name,
      description: m.description,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      objectCount: sceneArray.length,
      creator: m.user,
    };
  });

  return NextResponse.json({
    models: modelsWithMeta,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
```

- [ ] **Step 2: Create single model API (with thumbnail)**

Create `src/app/api/admin/models/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/auditLog";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const model = await prisma.savedModel.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, plan: true } },
    },
  });

  if (!model) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ model });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.savedModel.delete({ where: { id } });
  await logAdminAction(session.user.id, "delete_model", id);

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Create bulk delete API**

Create `src/app/api/admin/models/bulk-delete/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/auditLog";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids array required" }, { status: 400 });
  }

  await prisma.savedModel.deleteMany({ where: { id: { in: ids } } });
  await logAdminAction(session.user.id, "bulk_delete_models", undefined, { modelIds: ids });

  return NextResponse.json({ success: true, deleted: ids.length });
}
```

- [ ] **Step 4: Create models moderation page**

Create `src/app/admin/models/page.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Box,
  Image as ImageIcon,
} from "lucide-react";

interface ModelData {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  objectCount: number;
  creator: { id: string; name: string | null; email: string; plan: string };
}

interface ModelDetail {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  sceneData: unknown[];
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string | null; email: string; plan: string };
}

export default function AdminModelsPage() {
  const [models, setModels] = useState<ModelData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailModel, setDetailModel] = useState<ModelDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmBulk, setConfirmBulk] = useState(false);

  const fetchModels = () => {
    setLoading(true);
    fetch(`/api/admin/models?search=${encodeURIComponent(search)}&sort=${sort}&page=${page}`)
      .then((r) => r.json())
      .then((data) => {
        setModels(data.models || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
      });
  };

  useEffect(() => { fetchModels(); }, [page, sort]);

  const handleSearch = () => { setPage(1); fetchModels(); };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/models/${id}`, { method: "DELETE" });
    setConfirmDelete(null);
    setDetailModel(null);
    fetchModels();
  };

  const handleBulkDelete = async () => {
    await fetch("/api/admin/models/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    setSelected(new Set());
    setConfirmBulk(false);
    fetchModels();
  };

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    const res = await fetch(`/api/admin/models/${id}`);
    const data = await res.json();
    setDetailModel(data.model);
    setDetailLoading(false);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === models.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(models.map((m) => m.id)));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Content Moderation</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by model name or creator..."
            className="w-full pl-10 pr-4 py-2 bg-white/[0.02] border border-surface-border rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-white/[0.02] border border-surface-border rounded-lg text-sm text-white focus:outline-none focus:border-brand"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="creator">Creator</option>
        </select>
        {selected.size > 0 && (
          <button
            onClick={() => setConfirmBulk(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete {selected.size} selected
          </button>
        )}
      </div>

      <p className="text-sm text-gray-500 mb-4">{total} models total</p>

      {/* Table */}
      <div className="rounded-xl border border-surface-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/[0.02] text-gray-400 text-xs uppercase">
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selected.size === models.length && models.length > 0}
                  onChange={toggleAll}
                  className="rounded"
                />
              </th>
              <th className="text-left px-4 py-3">Model</th>
              <th className="text-left px-4 py-3">Creator</th>
              <th className="text-left px-4 py-3">Objects</th>
              <th className="text-left px-4 py-3">Created</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {models.map((model) => (
              <tr key={model.id} className="hover:bg-white/[0.01]">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(model.id)}
                    onChange={() => toggleSelect(model.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => openDetail(model.id)}
                    className="text-white font-medium hover:text-brand text-left"
                  >
                    {model.name}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <p className="text-gray-300">{model.creator.name || "—"}</p>
                  <p className="text-gray-500 text-xs">{model.creator.email}</p>
                </td>
                <td className="px-4 py-3 text-gray-300">{model.objectCount}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(model.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setConfirmDelete(model.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-surface-border text-gray-400 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-surface-border text-gray-400 hover:text-white disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {(detailModel || detailLoading) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-surface-border rounded-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-auto">
            {detailLoading ? (
              <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto" />
            ) : detailModel ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">{detailModel.name}</h3>
                  <button onClick={() => setDetailModel(null)} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {detailModel.thumbnail ? (
                  <img src={detailModel.thumbnail} alt={detailModel.name} className="w-full rounded-lg mb-4" />
                ) : (
                  <div className="w-full aspect-video bg-gray-800 rounded-lg mb-4 flex items-center justify-center text-gray-600">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
                <div className="space-y-2 text-sm">
                  {detailModel.description && (
                    <p className="text-gray-300">{detailModel.description}</p>
                  )}
                  <p className="text-gray-400">Creator: <span className="text-white">{detailModel.user.name || detailModel.user.email}</span> ({detailModel.user.plan})</p>
                  <p className="text-gray-400">Objects: <span className="text-white">{Array.isArray(detailModel.sceneData) ? detailModel.sceneData.length : 0}</span></p>
                  <p className="text-gray-400">Created: <span className="text-white">{new Date(detailModel.createdAt).toLocaleString()}</span></p>
                  <p className="text-gray-400">Updated: <span className="text-white">{new Date(detailModel.updatedAt).toLocaleString()}</span></p>
                </div>
                <button
                  onClick={() => setConfirmDelete(detailModel.id)}
                  className="mt-4 w-full py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Model
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-gray-900 border border-surface-border rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-white mb-2">Delete Model?</h3>
            <p className="text-gray-400 text-sm mb-4">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white border border-surface-border">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="px-4 py-2 rounded-lg text-sm text-white bg-red-600 hover:bg-red-500">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation */}
      {confirmBulk && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-gray-900 border border-surface-border rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-white mb-2">Delete {selected.size} Models?</h3>
            <p className="text-gray-400 text-sm mb-4">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmBulk(false)} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white border border-surface-border">Cancel</button>
              <button onClick={handleBulkDelete} className="px-4 py-2 rounded-lg text-sm text-white bg-red-600 hover:bg-red-500">Delete All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Verify build**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/models/ src/app/api/admin/models/
git commit -m "feat: add content moderation with paginated models, preview modal, and bulk delete"
```

---

### Task 12: Add impersonation

**Files:**
- Create: `src/app/api/admin/impersonate/route.ts`
- Create: `src/app/api/admin/impersonate/exit/route.ts`
- Create: `src/components/ImpersonationBanner.tsx`
- Modify: `src/lib/auth.ts` (jwt callback)
- Modify: `src/types/next-auth.d.ts`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update types for impersonation fields**

In `src/types/next-auth.d.ts`, add to the JWT interface:

```ts
    impersonatingUserId?: string;
    impersonatingUserName?: string;
```

Add to the Session user interface:

```ts
      impersonatingUserId?: string;
      impersonatingUserName?: string;
```

- [ ] **Step 2: Update auth.ts jwt and session callbacks**

In `src/lib/auth.ts`, in the `jwt` callback, add after the `trigger === "update"` block:

```ts
      // Handle impersonation
      if (trigger === "update" && token.userId) {
        // Check if this is an impersonation update
        // The update call will pass the data through
      }
```

Actually, we need to handle impersonation in the session callback. In the `session` callback, add after the existing assignments:

```ts
        session.user.impersonatingUserId = token.impersonatingUserId as string | undefined;
        session.user.impersonatingUserName = token.impersonatingUserName as string | undefined;
```

- [ ] **Step 3: Create impersonate start API**

Create `src/app/api/admin/impersonate/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/auditLog";
import { encode } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await req.json();
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, plan: true, emailVerified: true, status: true },
  });

  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await logAdminAction(session.user.id, "impersonate_start", userId);

  // Create a new JWT with impersonation data
  const token = await encode({
    secret: process.env.NEXTAUTH_SECRET!,
    token: {
      userId: session.user.id, // Keep real admin ID
      impersonatingUserId: target.id,
      impersonatingUserName: target.name || target.email,
      plan: target.plan,
      emailVerified: target.emailVerified,
      status: target.status,
      email: target.email,
      name: target.name,
      sub: session.user.id,
    },
  });

  const response = NextResponse.json({ success: true });

  // Set the new session cookie
  const cookieName = process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return response;
}
```

- [ ] **Step 4: Create impersonate exit API**

Create `src/app/api/admin/impersonate/exit/route.ts`:

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/auditLog";
import { encode } from "next-auth/jwt";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // The real admin ID is always in session.user.id (userId in JWT)
  const adminId = session.user.id;
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { id: true, name: true, email: true, plan: true, emailVerified: true, status: true },
  });

  if (!admin || !(await isAdmin(admin.email!))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await logAdminAction(adminId, "impersonate_end", session.user.impersonatingUserId);

  // Restore admin session
  const token = await encode({
    secret: process.env.NEXTAUTH_SECRET!,
    token: {
      userId: admin.id,
      plan: admin.plan,
      emailVerified: admin.emailVerified,
      status: admin.status,
      email: admin.email,
      name: admin.name,
      sub: admin.id,
    },
  });

  const response = NextResponse.json({ success: true });

  const cookieName = process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return response;
}
```

- [ ] **Step 5: Create ImpersonationBanner component**

Create `src/components/ImpersonationBanner.tsx`:

```tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, X } from "lucide-react";

export default function ImpersonationBanner() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session?.user?.impersonatingUserId) return null;

  const handleExit = async () => {
    await fetch("/api/admin/impersonate/exit", { method: "POST" });
    router.push("/admin/users");
    router.refresh();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-yellow-600 text-black text-sm font-medium py-1.5 px-4 flex items-center justify-center gap-3">
      <Eye className="w-4 h-4" />
      <span>Viewing as {session.user.impersonatingUserName}</span>
      <button
        onClick={handleExit}
        className="flex items-center gap-1 bg-black/20 hover:bg-black/30 px-2 py-0.5 rounded text-xs font-bold"
      >
        <X className="w-3 h-3" />
        Exit
      </button>
    </div>
  );
}
```

- [ ] **Step 6: Add ImpersonationBanner to root layout**

In `src/app/layout.tsx`, import and add the banner inside the Providers component, before the Navbar:

```tsx
import ImpersonationBanner from "@/components/ImpersonationBanner";
```

Inside the Providers wrapper, add before `<Navbar />`:

```tsx
<ImpersonationBanner />
```

- [ ] **Step 7: Verify build**

```bash
npx tsc --noEmit
```

- [ ] **Step 8: Commit**

```bash
git add src/app/api/admin/impersonate/ src/components/ImpersonationBanner.tsx src/app/layout.tsx src/lib/auth.ts src/types/next-auth.d.ts
git commit -m "feat: add user impersonation with JWT token swap and banner"
```

---

## Chunk 5: Settings Page and Navbar Integration

### Task 13: Create settings page and APIs

**Files:**
- Create: `src/app/admin/settings/page.tsx`
- Create: `src/app/api/admin/settings/route.ts`
- Create: `src/app/api/admin/settings/admins/route.ts`
- Create: `src/app/api/admin/settings/admins/remove/route.ts`

- [ ] **Step 1: Create settings API**

Create `src/app/api/admin/settings/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin, getSettings, setSetting } from "@/lib/settings";
import { logAdminAction } from "@/lib/auditLog";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updates = await req.json();
  const oldSettings = await getSettings();

  for (const [key, value] of Object.entries(updates)) {
    await setSetting(key, String(value));
    await logAdminAction(session.user.id, "update_setting", undefined, {
      key,
      from: oldSettings[key],
      to: value,
    });
  }

  const settings = await getSettings();
  return NextResponse.json({ settings });
}
```

- [ ] **Step 2: Create admins list/add API**

Create `src/app/api/admin/settings/admins/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin, getAdminEmails, getSetting, setSetting } from "@/lib/settings";
import { logAdminAction } from "@/lib/auditLog";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const emails = await getAdminEmails();
  return NextResponse.json({ emails });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email } = await req.json();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const emails = await getAdminEmails();
  if (emails.includes(email)) {
    return NextResponse.json({ error: "Already an admin" }, { status: 400 });
  }

  emails.push(email);
  await setSetting("admin_emails", JSON.stringify(emails));
  await logAdminAction(session.user.id, "add_admin", undefined, { email });

  return NextResponse.json({ emails });
}
```

- [ ] **Step 3: Create admin remove API**

Create `src/app/api/admin/settings/admins/remove/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin, getAdminEmails, setSetting } from "@/lib/settings";
import { logAdminAction } from "@/lib/auditLog";

const SUPER_ADMIN = "coolbanana558@gmail.com";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email } = await req.json();

  if (email === SUPER_ADMIN) {
    return NextResponse.json({ error: "Cannot remove super admin" }, { status: 400 });
  }

  if (email === session.user.email) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  const emails = await getAdminEmails();
  const filtered = emails.filter((e) => e !== email);
  await setSetting("admin_emails", JSON.stringify(filtered));
  await logAdminAction(session.user.id, "remove_admin", undefined, { email });

  return NextResponse.json({ emails: filtered });
}
```

- [ ] **Step 4: Create settings page**

Create `src/app/admin/settings/page.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Save,
  Plus,
  X,
  Lock,
  Loader2,
  Settings,
} from "lucide-react";

const SUPER_ADMIN = "coolbanana558@gmail.com";

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [admins, setAdmins] = useState<string[]>([]);
  const [newAdmin, setNewAdmin] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/settings").then((r) => r.json()),
      fetch("/api/admin/settings/admins").then((r) => r.json()),
    ]).then(([settingsData, adminsData]) => {
      setSettings(settingsData.settings || {});
      setAdmins(adminsData.emails || []);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSetting = (key: string) => {
    const current = settings[key] === "true";
    updateSetting(key, String(!current));
  };

  const addAdmin = async () => {
    if (!newAdmin.includes("@")) return;
    const res = await fetch("/api/admin/settings/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newAdmin }),
    });
    const data = await res.json();
    if (data.emails) setAdmins(data.emails);
    setNewAdmin("");
  };

  const removeAdmin = async (email: string) => {
    const res = await fetch("/api/admin/settings/admins/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (data.emails) setAdmins(data.emails);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  const limits = [
    { key: "free_model_limit", label: "Free Plan Model Limit", placeholder: "5" },
    { key: "free_generation_limit", label: "Free Plan Daily Generation Limit", placeholder: "10" },
    { key: "premium_model_limit", label: "Premium Plan Model Limit", placeholder: "null = unlimited" },
    { key: "premium_generation_limit", label: "Premium Plan Daily Generation Limit", placeholder: "null = unlimited" },
  ];

  const toggles = [
    { key: "disable_registration", label: "Disable New Registrations", description: "Block new account creation" },
    { key: "maintenance_mode", label: "Maintenance Mode", description: "Show maintenance page to non-admins" },
    { key: "disable_ai_generation", label: "Disable AI Generation", description: "Disable AI generation globally" },
    { key: "disable_credentials_auth", label: "Disable Email/Password Auth", description: "Only allow OAuth sign-in" },
  ];

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover text-white text-sm rounded-lg transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {/* Feature Limits */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Feature Limits</h2>
        <div className="space-y-4">
          {limits.map((limit) => (
            <div key={limit.key} className="flex items-center justify-between p-4 bg-white/[0.02] border border-surface-border rounded-lg">
              <label className="text-sm text-gray-300">{limit.label}</label>
              <input
                value={settings[limit.key] || ""}
                onChange={(e) => updateSetting(limit.key, e.target.value)}
                placeholder={limit.placeholder}
                className="w-32 px-3 py-1.5 bg-gray-900 border border-surface-border rounded-lg text-sm text-white text-right focus:outline-none focus:border-brand"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Feature Toggles */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Feature Toggles</h2>
        <div className="space-y-3">
          {toggles.map((toggle) => (
            <div key={toggle.key} className="flex items-center justify-between p-4 bg-white/[0.02] border border-surface-border rounded-lg">
              <div>
                <p className="text-sm text-white font-medium">{toggle.label}</p>
                <p className="text-xs text-gray-500">{toggle.description}</p>
              </div>
              <button
                onClick={() => toggleSetting(toggle.key)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  settings[toggle.key] === "true" ? "bg-red-500" : "bg-gray-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    settings[toggle.key] === "true" ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Admin Emails */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Admin Emails</h2>
        <div className="space-y-2 mb-4">
          {admins.map((email) => (
            <div key={email} className="flex items-center justify-between p-3 bg-white/[0.02] border border-surface-border rounded-lg">
              <span className="text-sm text-gray-300">{email}</span>
              {email === SUPER_ADMIN ? (
                <Lock className="w-4 h-4 text-gray-600" />
              ) : email === session?.user?.email ? (
                <span className="text-xs text-gray-600">You</span>
              ) : (
                <button
                  onClick={() => removeAdmin(email)}
                  className="p-1 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newAdmin}
            onChange={(e) => setNewAdmin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addAdmin()}
            placeholder="email@example.com"
            className="flex-1 px-3 py-2 bg-white/[0.02] border border-surface-border rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand"
          />
          <button
            onClick={addAdmin}
            className="px-4 py-2 bg-brand hover:bg-brand-hover text-white text-sm rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Verify build**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/settings/ src/app/api/admin/settings/
git commit -m "feat: add admin settings page with limits, toggles, and admin email management"
```

---

### Task 14: Add admin link to Navbar

**Files:**
- Modify: `src/components/Navbar.tsx`

- [ ] **Step 1: Add admin link to navbar dropdown**

In `src/components/Navbar.tsx`, add the `ShieldCheck` import to the lucide-react imports. Then in the authenticated user dropdown (the desktop dropdown menu that shows Dashboard and Sign Out), add an Admin link between the plan badge and the Dashboard link:

```tsx
{session.user.email === "coolbanana558@gmail.com" && (
  <Link
    href="/admin/dashboard"
    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
  >
    <ShieldCheck className="w-4 h-4 text-brand" />
    Admin
  </Link>
)}
```

Note: For now this uses a hardcoded email check. In a future iteration, this could call the settings service, but since the Navbar is a client component and the admin emails are in the DB, a simple hardcoded check is appropriate for the initial implementation. The admin layout and APIs do the real authorization server-side.

- [ ] **Step 2: Verify build**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Navbar.tsx
git commit -m "feat: add admin link to navbar for admin users"
```

---

### Task 15: Final build verification and push

**Files:** None (verification only)

- [ ] **Step 1: Full production build**

```bash
npm run build 2>&1 | tail -30
```

Expected: Build succeeds with all admin pages listed.

- [ ] **Step 2: Push to deploy**

```bash
git push origin main
```

- [ ] **Step 3: Run migration on production (if not already run in Task 1)**

Verify the new tables exist on Neon. If the migration was run locally against the production DB in Task 1, this is already done. Otherwise run:

```bash
POSTGRES_PRISMA_URL="<production-url>" npx prisma migrate deploy
```
