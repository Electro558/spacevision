# Auth, Premium & Vercel Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add user authentication (Google, GitHub, email/password), premium subscription tier with Stripe, model persistence, and migrate from GitHub Pages to Vercel.

**Architecture:** NextAuth.js v5 handles auth with Prisma adapter writing to Vercel Postgres. Stripe Checkout handles payments with webhooks updating user plan. Models saved as JSON in the database. Middleware protects /dashboard; /generate stays open for anonymous manual editing.

**Tech Stack:** NextAuth.js v5, Prisma ORM, Vercel Postgres (Neon), Stripe, Resend, bcryptjs

**Spec:** `docs/superpowers/specs/2026-03-31-auth-premium-vercel-design.md`

---

## Chunk 1: Infrastructure — Vercel Migration, Prisma, Database

### Task 1: Remove static export and configure for Vercel

**Files:**
- Modify: `next.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Update next.config.ts**

Replace the entire file with:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "lh3.googleusercontent.com" },
      { hostname: "avatars.githubusercontent.com" },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 2: Verify dev server starts**

Run: `npm run dev`
Expected: App starts on localhost:3000 with no errors

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "chore: remove static export config for Vercel migration"
```

---

### Task 2: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install auth, database, payments, and email dependencies**

```bash
npm install next-auth@5 @auth/prisma-adapter @prisma/client bcryptjs stripe resend
npm install -D prisma @types/bcryptjs
```

- [ ] **Step 2: Verify installation**

Run: `npx prisma --version`
Expected: Shows Prisma version

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add auth, database, payments, and email dependencies"
```

---

### Task 3: Set up Prisma schema and generate client

**Files:**
- Create: `prisma/schema.prisma`
- Create: `.env.example` (update)

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 2: Write the Prisma schema**

Replace `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("POSTGRES_PRISMA_URL")
  directUrl = env("POSTGRES_URL_NON_POOLING")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model User {
  id                   String    @id @default(cuid())
  name                 String?
  email                String    @unique
  emailVerified        DateTime?
  image                String?
  password             String?
  plan                 Plan      @default(FREE)
  stripeCustomerId     String?   @unique
  stripeSubscriptionId String?
  dailyGenerations     Int       @default(0)
  lastGenerationDate   DateTime?
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  accounts   Account[]
  sessions   Session[]
  savedModels SavedModel[]
}

model SavedModel {
  id          String   @id @default(cuid())
  name        String
  description String?
  sceneData   Json
  thumbnail   String?  @db.Text
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
}

enum Plan {
  FREE
  PREMIUM
}
```

- [ ] **Step 3: Create Prisma client singleton**

Create `src/lib/prisma.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 4: Update .env.example**

Add to `.env.example`:

```
# Database (auto-added by Vercel Postgres)
POSTGRES_PRISMA_URL=postgresql://user:pass@host:5432/db?pgbouncer=true
POSTGRES_URL_NON_POOLING=postgresql://user:pass@host:5432/db

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...

# Email
RESEND_API_KEY=re_...

# Admin
ADMIN_SECRET=your-admin-secret

# AI (existing)
ANTHROPIC_API_KEY=your-api-key-here
```

- [ ] **Step 5: Add prisma to .gitignore**

Append to `.gitignore`:

```
# Prisma
prisma/migrations/migration_lock.toml
```

- [ ] **Step 6: Set up local Postgres for development**

For local development, you need a running Postgres instance. Options:
- **Docker:** `docker run --name spacevision-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16`
- **Vercel Postgres:** Connect your Vercel Postgres to `.env.local` (copy `POSTGRES_*` vars from Vercel dashboard)

Set in `.env.local`:
```
POSTGRES_PRISMA_URL=postgresql://postgres:postgres@localhost:5432/spacevision?pgbouncer=true
POSTGRES_URL_NON_POOLING=postgresql://postgres:postgres@localhost:5432/spacevision
```

If using Docker, create the database: `docker exec -it spacevision-db psql -U postgres -c "CREATE DATABASE spacevision;"`

- [ ] **Step 7: Generate Prisma client**

Run: `npx prisma generate`
Expected: "✔ Generated Prisma Client"

- [ ] **Step 8: Run initial migration**

Run: `npx prisma migrate dev --name init`
Expected: Creates migration and applies to local database.

- [ ] **Step 9: Commit**

```bash
git add prisma/ src/lib/prisma.ts .env.example .gitignore
git commit -m "feat: add Prisma schema with User, SavedModel, and auth tables"
```

---

## Chunk 2: Authentication — NextAuth, Login, Register

### Task 4: Configure NextAuth.js v5

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create auth configuration**

Create `src/lib/auth.ts`:

```ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { Plan } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // Link OAuth to existing email/password accounts
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;
        return user;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Block credentials login for OAuth-only users (no password set)
      if (account?.provider === "credentials") {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: { password: true },
        });
        if (!dbUser?.password) return false;
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: { id: true, plan: true, emailVerified: true },
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.plan = dbUser.plan;
          token.emailVerified = dbUser.emailVerified;
        }
      }
      // Refresh plan and emailVerified from DB on session update
      if (trigger === "update" && token.userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.userId as string },
          select: { plan: true, emailVerified: true },
        });
        if (dbUser) {
          token.plan = dbUser.plan;
          token.emailVerified = dbUser.emailVerified;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.plan = token.plan as Plan;
        session.user.emailVerified = token.emailVerified as Date | null;
      }
      return session;
    },
  },
});
```

- [ ] **Step 2: Extend NextAuth types**

Create `src/types/next-auth.d.ts`:

```ts
import { Plan } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      plan: Plan;
      emailVerified: Date | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    plan: Plan;
    emailVerified: Date | null;
  }
}
```

- [ ] **Step 3: Create NextAuth API route handler**

Create `src/app/api/auth/[...nextauth]/route.ts`:

```ts
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 4: Verify dev server starts with auth configured**

Run: `npm run dev`
Expected: Starts without errors (auth routes won't work yet without DB, but app should compile)

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts src/types/next-auth.d.ts src/app/api/auth/
git commit -m "feat: configure NextAuth.js v5 with Google, GitHub, and credentials providers"
```

---

### Task 5: Create registration API route

**Files:**
- Create: `src/app/api/register/route.ts`

- [ ] **Step 1: Create registration endpoint**

Create `src/app/api/register/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Password validation: min 8 chars, at least one letter and one number
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one letter and one number" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // If they signed up via OAuth, tell them to use that provider
      if (!existing.password) {
        return NextResponse.json(
          { error: "This email is linked to a social login. Please sign in with Google or GitHub." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name || null,
        email,
        password: hashedPassword,
      },
    });

    // TODO: Send verification email via Resend (Task 6)

    return NextResponse.json(
      { message: "Account created. Please check your email to verify." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/register/route.ts
git commit -m "feat: add registration API route with password validation"
```

---

### Task 6: Create email verification flow

**Files:**
- Create: `src/lib/email.ts`
- Modify: `src/app/api/register/route.ts`
- Create: `src/app/api/verify-email/route.ts`

- [ ] **Step 1: Create email utility**

Create `src/lib/email.ts`:

```ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/api/verify-email?token=${token}`;

  await resend.emails.send({
    from: "SpaceVision <noreply@spacevision.app>",
    to: email,
    subject: "Verify your SpaceVision account",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Welcome to SpaceVision!</h2>
        <p>Click the button below to verify your email address:</p>
        <a href="${verifyUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Verify Email
        </a>
        <p style="color: #666; margin-top: 24px; font-size: 14px;">
          This link expires in 24 hours. If you didn't create an account, you can ignore this email.
        </p>
      </div>
    `,
  });
}
```

- [ ] **Step 2: Update registration to send verification email**

In `src/app/api/register/route.ts`, add the import at the top:

```ts
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";
```

Replace the `// TODO: Send verification email via Resend (Task 6)` comment with:

```ts
    // Create verification token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // Send verification email (non-blocking — don't fail registration if email fails)
    sendVerificationEmail(email, token).catch((err) =>
      console.error("Failed to send verification email:", err)
    );
```

- [ ] **Step 3: Create verification endpoint**

Create `src/app/api/verify-email/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid-token", req.url));
  }

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken || verificationToken.expires < new Date()) {
    return NextResponse.redirect(new URL("/login?error=expired-token", req.url));
  }

  // Mark user as verified
  await prisma.user.update({
    where: { email: verificationToken.identifier },
    data: { emailVerified: new Date() },
  });

  // Delete used token
  await prisma.verificationToken.delete({
    where: { token },
  });

  return NextResponse.redirect(new URL("/login?verified=true", req.url));
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/email.ts src/app/api/register/route.ts src/app/api/verify-email/route.ts
git commit -m "feat: add email verification flow with Resend"
```

---

### Task 7: Create login page

**Files:**
- Create: `src/app/login/page.tsx`

- [ ] **Step 1: Create login page**

Create `src/app/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Mail, Lock, Github, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const verified = searchParams.get("verified") === "true";
  const tokenError = searchParams.get("error");

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/generate");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Welcome back</h1>
          <p className="text-gray-400 mt-2">Sign in to your SpaceVision account</p>
        </div>

        {verified && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-lg mb-4 text-sm text-center">
            Email verified! You can now sign in.
          </div>
        )}

        {tokenError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg mb-4 text-sm text-center">
            {tokenError === "expired-token"
              ? "Verification link has expired. Please register again."
              : "Invalid verification link."}
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          {/* OAuth Buttons */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/generate" })}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-medium py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <button
            onClick={() => signIn("github", { callbackUrl: "/generate" })}
            className="w-full flex items-center justify-center gap-3 bg-gray-800 text-white font-medium py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
          >
            <Github className="w-5 h-5" />
            Continue with GitHub
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900 text-gray-400">or</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleCredentialsLogin} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Sign In
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/login/page.tsx
git commit -m "feat: add login page with Google, GitHub, and email/password"
```

---

### Task 8: Create registration page

**Files:**
- Create: `src/app/register/page.tsx`
- Create: `src/app/verify-email/page.tsx`

- [ ] **Step 1: Create registration page**

Create `src/app/register/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Github, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }

      router.push("/verify-email");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Create an account</h1>
          <p className="text-gray-400 mt-2">Start building 3D models with AI</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          {/* OAuth Buttons */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/generate" })}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-medium py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <button
            onClick={() => signIn("github", { callbackUrl: "/generate" })}
            className="w-full flex items-center justify-center gap-3 bg-gray-800 text-white font-medium py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
          >
            <Github className="w-5 h-5" />
            Continue with GitHub
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900 text-gray-400">or</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                placeholder="Password (min 8 chars, letter + number)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Account
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create verify-email page**

Create `src/app/verify-email/page.tsx`:

```tsx
import { Mail } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
          <p className="text-gray-400 mb-6">
            We sent a verification link to your email address. Click the link to activate your account.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            The link expires in 24 hours. Check your spam folder if you don&apos;t see it.
          </p>
          <Link
            href="/login"
            className="text-indigo-400 hover:text-indigo-300 text-sm"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/register/page.tsx src/app/verify-email/page.tsx
git commit -m "feat: add registration and email verification pages"
```

---

### Task 9: Add auth middleware and update Navbar

**Files:**
- Create: `src/middleware.ts`
- Modify: `src/components/Navbar.tsx`

- [ ] **Step 1: Create auth middleware**

Create `src/middleware.ts`:

```ts
export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

- [ ] **Step 2: Update Navbar with real auth**

Replace the full content of `src/components/Navbar.tsx` with:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, User, ChevronDown } from "lucide-react";

export default function Navbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { data: session, status } = useSession();

  const links = [
    { label: "Workspace", href: "/generate" },
    { label: "Gallery", href: "/gallery" },
    { label: "Pricing", href: "/pricing" },
    { label: "Dashboard", href: "/dashboard" },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg" />
          <span className="text-white font-bold text-lg">SpaceVision</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-gray-300 hover:text-white transition-colors text-sm"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-3">
          {status === "loading" ? (
            <div className="w-8 h-8 rounded-full bg-gray-800 animate-pulse" />
          ) : session?.user ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                    {session.user.name?.[0] || session.user.email?.[0] || "?"}
                  </div>
                )}
                <ChevronDown className="w-4 h-4" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl py-1">
                  <div className="px-3 py-2 border-b border-gray-800">
                    <p className="text-sm text-white font-medium truncate">
                      {session.user.name || "User"}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {session.user.email}
                    </p>
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400">
                      {session.user.plan === "PREMIUM" ? "Premium" : "Free"}
                    </span>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    <User className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="md:hidden text-gray-300 hover:text-white"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-gray-950 border-b border-gray-800"
          >
            <div className="px-4 py-4 space-y-3">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileOpen(false)}
                  className="block text-gray-300 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-gray-800">
                {session?.user ? (
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Sign Out
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMobileOpen(false)}
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
```

- [ ] **Step 3: Create Providers wrapper component**

Create `src/components/Providers.tsx`:

```tsx
"use client";

import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

- [ ] **Step 4: Wrap root layout with Providers**

In `src/app/layout.tsx`, import the Providers component and wrap the body children. The layout stays a Server Component (no `"use client"` needed):

```tsx
import Providers from "@/components/Providers";
```

Inside the `<body>` tag, wrap children:

```tsx
<body>
  <Providers>
    {children}
  </Providers>
</body>
```

- [ ] **Step 5: Verify dev server compiles**

Run: `npm run dev`
Expected: Compiles without errors. Navbar shows "Sign In" / "Get Started" buttons.

- [ ] **Step 6: Commit**

```bash
git add src/middleware.ts src/components/Navbar.tsx src/components/Providers.tsx src/app/layout.tsx
git commit -m "feat: add auth middleware, update Navbar with real auth, add SessionProvider"
```

---

## Chunk 3: Stripe Payments & Premium Gating

### Task 10: Create Stripe checkout and webhook routes

**Files:**
- Create: `src/lib/stripe.ts`
- Create: `src/app/api/stripe/checkout/route.ts`
- Create: `src/app/api/stripe/portal/route.ts`
- Create: `src/app/api/stripe/webhook/route.ts`

- [ ] **Step 1: Create Stripe client singleton**

Create `src/lib/stripe.ts`:

```ts
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});
```

- [ ] **Step 2: Create checkout route**

Create `src/app/api/stripe/checkout/route.ts`:

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true, email: true },
  });

  let customerId = user?.stripeCustomerId;

  // Create Stripe customer if needed
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user?.email || session.user.email!,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: session.user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: process.env.STRIPE_PREMIUM_PRICE_ID!,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
    metadata: { userId: session.user.id },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
```

- [ ] **Step 3: Create portal route**

Create `src/app/api/stripe/portal/route.ts`:

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "No subscription found" }, { status: 400 });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.NEXTAUTH_URL}/dashboard`,
  });

  return NextResponse.json({ url: portalSession.url });
}
```

- [ ] **Step 4: Create webhook route**

Create `src/app/api/stripe/webhook/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (userId && session.subscription) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: "PREMIUM",
            stripeSubscriptionId: session.subscription as string,
          },
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customer = await stripe.customers.retrieve(
        subscription.customer as string
      );
      if ("deleted" in customer && customer.deleted) break;

      const user = await prisma.user.findUnique({
        where: { stripeCustomerId: subscription.customer as string },
      });
      if (!user) break;

      if (subscription.status === "canceled") {
        // Only downgrade if currently premium (idempotent)
        if (user.plan === "PREMIUM") {
          await prisma.user.update({
            where: { id: user.id },
            data: { plan: "FREE", stripeSubscriptionId: null },
          });
        }
      }
      // For past_due or unpaid: keep plan as PREMIUM (per spec) —
      // handle dunning emails in a future iteration
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const user = await prisma.user.findUnique({
        where: { stripeCustomerId: subscription.customer as string },
      });
      if (user && user.plan === "PREMIUM") {
        await prisma.user.update({
          where: { id: user.id },
          data: { plan: "FREE", stripeSubscriptionId: null },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/stripe.ts src/app/api/stripe/
git commit -m "feat: add Stripe checkout, billing portal, and webhook routes"
```

---

### Task 11: Create admin plan toggle route

**Files:**
- Create: `src/app/api/admin/user-plan/route.ts`

- [ ] **Step 1: Create admin route**

Create `src/app/api/admin/user-plan/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function PATCH(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (!secret || !process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Timing-safe comparison
  const expected = Buffer.from(process.env.ADMIN_SECRET);
  const received = Buffer.from(secret);
  if (
    expected.length !== received.length ||
    !crypto.timingSafeEqual(expected, received)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, plan } = await req.json();

  if (!userId || !["FREE", "PREMIUM"].includes(plan)) {
    return NextResponse.json({ error: "Invalid userId or plan" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { plan },
    select: { id: true, email: true, plan: true },
  });

  return NextResponse.json({ user });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/user-plan/route.ts
git commit -m "feat: add admin API route for manual plan toggle"
```

---

### Task 12: Create UpgradeModal and update pricing page

**Files:**
- Create: `src/components/UpgradeModal.tsx`
- Modify: `src/app/pricing/page.tsx`

- [ ] **Step 1: Create UpgradeModal component**

Create `src/components/UpgradeModal.tsx`:

```tsx
"use client";

import { useState } from "react";
import { X, Crown, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

export default function UpgradeModal({ isOpen, onClose, feature }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-sm w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-bold text-white">Upgrade to Premium</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {feature && (
          <p className="text-gray-400 text-sm mb-4">
            <span className="text-white font-medium">{feature}</span> is a premium feature.
          </p>
        )}

        <ul className="space-y-2 mb-6 text-sm text-gray-300">
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span> Unlimited AI generations
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span> Unlimited saved models
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span> All export formats (STL, OBJ, GLTF)
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span> Advanced composition recipes
          </li>
        </ul>

        <div className="flex items-baseline gap-1 mb-4">
          <span className="text-3xl font-bold text-white">$12</span>
          <span className="text-gray-400">/month</span>
        </div>

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Upgrade Now
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update pricing page with real tiers and Stripe checkout**

Replace the full content of `src/app/pricing/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, HelpCircle, Loader2, Crown } from "lucide-react";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with 3D modeling",
    features: [
      "10 AI generations per day",
      "Save up to 5 models",
      "STL export",
      "Basic composition recipes",
      "Simple & advanced editing modes",
    ],
    cta: "Get Started",
    href: "/generate",
    highlighted: false,
    plan: "FREE" as const,
  },
  {
    name: "Premium",
    price: "$12",
    period: "/month",
    description: "Unlimited creativity and exports",
    features: [
      "Unlimited AI generations",
      "Unlimited saved models",
      "All export formats (STL, OBJ, GLTF)",
      "Advanced composition recipes",
      "Priority support",
    ],
    cta: "Upgrade Now",
    href: null,
    highlighted: true,
    plan: "PREMIUM" as const,
  },
];

const faqs = [
  { q: "Can I cancel anytime?", a: "Yes, cancel anytime from your dashboard. You keep Premium until the end of your billing period." },
  { q: "What payment methods do you accept?", a: "We accept all major credit cards via Stripe." },
  { q: "Is there a free trial?", a: "The free tier is always free with generous limits. Try it out before upgrading." },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpgrade = async () => {
    if (!session) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  };

  const currentPlan = session?.user?.plan || "FREE";

  return (
    <div className="min-h-screen bg-gray-950 pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Simple, transparent pricing</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Start for free. Upgrade when you need unlimited AI generations and all export formats.
          </p>
        </div>

        {/* Tiers */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-16">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-8 ${
                tier.highlighted
                  ? "bg-indigo-600/10 border-2 border-indigo-500"
                  : "bg-gray-900 border border-gray-800"
              }`}
            >
              {currentPlan === tier.plan && (
                <span className="absolute top-4 right-4 text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/30">
                  Current Plan
                </span>
              )}
              <h3 className="text-xl font-bold text-white">{tier.name}</h3>
              <p className="text-gray-400 text-sm mt-1">{tier.description}</p>
              <div className="flex items-baseline gap-1 mt-4 mb-6">
                <span className="text-4xl font-bold text-white">{tier.price}</span>
                <span className="text-gray-400">{tier.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-gray-300 text-sm">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {tier.plan === "FREE" ? (
                <Link
                  href={tier.href!}
                  className="block w-full text-center py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors"
                >
                  {currentPlan === "FREE" ? "Open Workspace" : tier.cta}
                </Link>
              ) : currentPlan === "PREMIUM" ? (
                <button
                  onClick={async () => {
                    const res = await fetch("/api/stripe/portal", { method: "POST" });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  }}
                  className="w-full py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors"
                >
                  Manage Subscription
                </button>
              ) : (
                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Crown className="w-4 h-4" />
                  {tier.cta}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Coming Soon: Studio */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="rounded-2xl p-8 bg-gray-900/50 border border-gray-800/50 opacity-60">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-white">Studio</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">Coming Soon</span>
            </div>
            <p className="text-gray-500 text-sm">Team collaboration for up to 10 members, shared workspaces, and more.</p>
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            <HelpCircle className="inline w-6 h-6 mr-2" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <h3 className="font-medium text-white mb-1">{faq.q}</h3>
                <p className="text-gray-400 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/UpgradeModal.tsx src/app/pricing/page.tsx
git commit -m "feat: add UpgradeModal and wire pricing page to Stripe checkout"
```

---

### Task 13: Add rate limiting to AI generation route

**Files:**
- Modify: `src/app/api/generate/route.ts`

- [ ] **Step 1: Add auth check and rate limiting at the top of the POST handler**

At the top of the `POST` function in `src/app/api/generate/route.ts`, before the existing logic, add:

```ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
```

Then add this block at the start of the POST handler, before the prompt validation:

```ts
  // Auth check — AI generation requires login
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(
      JSON.stringify({ error: "Sign in to use AI generation" }),
      { status: 401 }
    );
  }

  // Email verification check
  if (!session.user.emailVerified) {
    return new Response(
      JSON.stringify({ error: "Please verify your email first" }),
      { status: 403 }
    );
  }

  // Rate limiting for free users
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, dailyGenerations: true, lastGenerationDate: true },
  });

  if (user && user.plan === "FREE") {
    const now = new Date();
    const lastDate = user.lastGenerationDate;
    const isNewDay =
      !lastDate ||
      lastDate.toISOString().slice(0, 10) !== now.toISOString().slice(0, 10);

    const currentCount = isNewDay ? 0 : user.dailyGenerations;

    if (currentCount >= 10) {
      return new Response(
        JSON.stringify({
          error: "Daily limit reached (10/day). Upgrade to Premium for unlimited.",
        }),
        { status: 429 }
      );
    }

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

- [ ] **Step 2: Verify the generate route still compiles**

Run: `npm run dev`
Navigate to `/generate`, expected: page loads (AI button won't work without auth, which is correct)

- [ ] **Step 3: Commit**

```bash
git add src/app/api/generate/route.ts
git commit -m "feat: add auth check and rate limiting to AI generation route"
```

---

## Chunk 4: Model Persistence — Save, Load, Dashboard

### Task 14: Add sceneToJSON and sceneFromJSON to cadStore

**Files:**
- Modify: `src/lib/cadStore.ts`

- [ ] **Step 1: Add JSON serialization functions**

At the bottom of `src/lib/cadStore.ts`, add:

```ts
/**
 * Converts scene objects to a plain JSON-serializable format for database storage.
 * Strips Three.js refs and non-serializable data.
 */
export function sceneToJSON(objects: SceneObject[]): object[] {
  return objects.map((obj) => ({
    id: obj.id,
    name: obj.name,
    type: obj.type,
    position: [...obj.position],
    rotation: [...obj.rotation],
    scale: [...obj.scale],
    color: obj.color,
    metalness: obj.metalness,
    roughness: obj.roughness,
    opacity: obj.opacity ?? 1,
    materialPreset: obj.materialPreset || null,
    texture: obj.texture || null,
    smoothness: obj.smoothness ?? 0,
    visible: obj.visible,
    locked: obj.locked,
    isHole: obj.isHole,
    groupId: obj.groupId,
    params: obj.params,
  }));
}

/**
 * Reconstructs SceneObject[] from stored JSON data.
 * Assigns new IDs if needed and ensures all required fields have defaults.
 */
export function sceneFromJSON(data: unknown): SceneObject[] {
  if (!Array.isArray(data)) return [];

  return data.map((item: Record<string, unknown>) => ({
    id: (item.id as string) || crypto.randomUUID(),
    name: (item.name as string) || "Object",
    type: (item.type as SceneObject["type"]) || "box",
    position: (item.position as [number, number, number]) || [0, 0, 0],
    rotation: (item.rotation as [number, number, number]) || [0, 0, 0],
    scale: (item.scale as [number, number, number]) || [1, 1, 1],
    color: (item.color as string) || "#6366f1",
    metalness: (item.metalness as number) ?? 0,
    roughness: (item.roughness as number) ?? 0.5,
    opacity: (item.opacity as number) ?? 1,
    materialPreset: (item.materialPreset as string) || undefined,
    texture: (item.texture as string) || undefined,
    smoothness: (item.smoothness as number) ?? 0,
    visible: (item.visible as boolean) ?? true,
    locked: (item.locked as boolean) ?? false,
    isHole: (item.isHole as boolean) ?? false,
    groupId: (item.groupId as string) || null,
    params: (item.params as ShapeParams) || {},
  }));
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/cadStore.ts
git commit -m "feat: add sceneToJSON and sceneFromJSON for model persistence"
```

---

### Task 15: Create model CRUD API routes

**Files:**
- Create: `src/app/api/models/route.ts`
- Create: `src/app/api/models/[id]/route.ts`

- [ ] **Step 1: Create models list and create route**

Create `src/app/api/models/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/models — list user's models
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const models = await prisma.savedModel.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      thumbnail: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ models });
}

// POST /api/models — create a new model
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check model limit for free users
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  if (user?.plan === "FREE") {
    const count = await prisma.savedModel.count({
      where: { userId: session.user.id },
    });
    if (count >= 5) {
      return NextResponse.json(
        { error: "Free plan limit: 5 models. Upgrade to Premium for unlimited." },
        { status: 403 }
      );
    }
  }

  const { name, description, sceneData, thumbnail } = await req.json();

  if (!name || !sceneData) {
    return NextResponse.json(
      { error: "Name and sceneData are required" },
      { status: 400 }
    );
  }

  const model = await prisma.savedModel.create({
    data: {
      name,
      description: description || null,
      sceneData,
      thumbnail: thumbnail || null,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ model }, { status: 201 });
}
```

- [ ] **Step 2: Create individual model route**

Create `src/app/api/models/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/models/[id] — get a specific model
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const model = await prisma.savedModel.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!model) {
    return NextResponse.json({ error: "Model not found" }, { status: 404 });
  }

  return NextResponse.json({ model });
}

// PUT /api/models/[id] — update a model
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership
  const existing = await prisma.savedModel.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Model not found" }, { status: 404 });
  }

  const { name, description, sceneData, thumbnail } = await req.json();

  const model = await prisma.savedModel.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(sceneData !== undefined && { sceneData }),
      ...(thumbnail !== undefined && { thumbnail }),
    },
  });

  return NextResponse.json({ model });
}

// DELETE /api/models/[id] — delete a model
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.savedModel.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Model not found" }, { status: 404 });
  }

  await prisma.savedModel.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/models/
git commit -m "feat: add model CRUD API routes with auth and plan limits"
```

---

### Task 16: Add save/load to the generate page

**Files:**
- Modify: `src/app/generate/page.tsx`

- [ ] **Step 1: Add save/load state and functions**

At the top of the generate page component, add these imports:

```ts
import { useSession } from "next-auth/react";
import { sceneToJSON, sceneFromJSON } from "@/lib/cadStore";
import { Save, FolderOpen } from "lucide-react";
```

Add state variables:

```ts
const { data: session } = useSession();
const [modelId, setModelId] = useState<string | null>(null);
const [modelName, setModelName] = useState<string>("");
const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
const [showUpgradeModal, setShowUpgradeModal] = useState(false);
const [upgradeFeature, setUpgradeFeature] = useState("");
```

Add save function:

```ts
const handleSave = async () => {
  if (!session) return;
  setSaveStatus("saving");

  const sceneData = sceneToJSON(objects);
  // Capture thumbnail from canvas
  const canvas = document.querySelector("canvas");
  const thumbnail = canvas?.toDataURL("image/jpeg", 0.6) || null;

  try {
    if (modelId) {
      // Update existing
      await fetch(`/api/models/${modelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sceneData, thumbnail }),
      });
    } else {
      // Create new
      const name = modelName || `Model ${new Date().toLocaleDateString()}`;
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, sceneData, thumbnail }),
      });
      const data = await res.json();
      if (res.status === 403) {
        setUpgradeFeature("Saving more models");
        setShowUpgradeModal(true);
        setSaveStatus("idle");
        return;
      }
      if (data.model) {
        setModelId(data.model.id);
        setModelName(name);
      }
    }
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  } catch {
    setSaveStatus("idle");
  }
};
```

Add load function (called on mount when `modelId` is in URL):

```ts
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const loadId = params.get("modelId");
  if (loadId && session) {
    fetch(`/api/models/${loadId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.model) {
          setModelId(data.model.id);
          setModelName(data.model.name);
          const loaded = sceneFromJSON(data.model.sceneData);
          setObjects(loaded);
        }
      });
  }
}, [session]);
```

- [ ] **Step 2: Add save button to toolbar**

In the toolbar area (around line 1083-1123 of generate/page.tsx), add a save button next to the existing export button:

```tsx
{session && (
  <button
    onClick={handleSave}
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors"
    title="Save model"
  >
    <Save className="w-4 h-4" />
    {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved!" : "Save"}
  </button>
)}
```

- [ ] **Step 3: Add auth banner for anonymous users**

At the top of the viewport area, add:

```tsx
{!session && (
  <div className="bg-indigo-600/10 border border-indigo-500/30 text-indigo-300 text-sm px-4 py-2 text-center">
    <a href="/login" className="underline hover:text-white">Sign in</a> to save your work and use AI generation.
  </div>
)}
```

- [ ] **Step 4: Add UpgradeModal to the page**

Import and render at the bottom of the component:

```tsx
<UpgradeModal
  isOpen={showUpgradeModal}
  onClose={() => setShowUpgradeModal(false)}
  feature={upgradeFeature}
/>
```

- [ ] **Step 5: Commit**

```bash
git add src/app/generate/page.tsx
git commit -m "feat: add save/load functionality and auth banner to generate page"
```

---

### Task 17: Overhaul dashboard with real data

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Rewrite dashboard with real model data**

Replace the full content of `src/app/dashboard/page.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Plus, Trash2, Pencil, ExternalLink, Crown, Loader2,
  FolderOpen, Check,
} from "lucide-react";

interface SavedModel {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [models, setModels] = useState<SavedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const upgraded = searchParams.get("upgraded") === "true";
  const isPremium = session?.user?.plan === "PREMIUM";

  // Poll for plan update after Stripe checkout redirect
  useEffect(() => {
    if (!upgraded || isPremium) return;
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const res = await fetch("/api/user/plan");
      const data = await res.json();
      if (data.plan === "PREMIUM") {
        await update(); // Refresh session JWT
        clearInterval(interval);
      }
      if (attempts >= 5) clearInterval(interval);
    }, 2000);
    return () => clearInterval(interval);
  }, [upgraded, isPremium, update]);

  // Fetch models
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/models")
      .then((res) => res.json())
      .then((data) => {
        setModels(data.models || []);
        setLoading(false);
      });
  }, [status]);

  const handleDelete = async (id: string) => {
    await fetch(`/api/models/${id}`, { method: "DELETE" });
    setModels((prev) => prev.filter((m) => m.id !== id));
    setDeleteConfirm(null);
  };

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) return;
    await fetch(`/api/models/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameValue }),
    });
    setModels((prev) =>
      prev.map((m) => (m.id === id ? { ...m, name: renameValue } : m))
    );
    setRenamingId(null);
  };

  const handleManageSubscription = async () => {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  const modelLimit = isPremium ? null : 5;
  const modelCountText = modelLimit
    ? `${models.length} / ${modelLimit} models`
    : `${models.length} models`;

  return (
    <div className="min-h-screen bg-gray-950 pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-1">
              {modelCountText}
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400">
                {isPremium ? "Premium" : "Free"}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isPremium && (
              <button
                onClick={handleManageSubscription}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Manage Subscription
              </button>
            )}
            <Link
              href="/generate"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Model
            </Link>
          </div>
        </div>

        {/* Upgrade banner for free users */}
        {!isPremium && (
          <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-xl p-4 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-white font-medium">Upgrade to Premium</p>
                <p className="text-gray-400 text-sm">Unlimited models, exports, and AI generations</p>
              </div>
            </div>
            <Link
              href="/pricing"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              View Plans
            </Link>
          </div>
        )}

        {upgraded && isPremium && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl p-4 mb-8 flex items-center gap-2">
            <Check className="w-5 h-5" />
            Welcome to Premium! You now have unlimited access.
          </div>
        )}

        {/* Models Grid */}
        {models.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No models yet</h2>
            <p className="text-gray-400 mb-6">Create your first 3D model to see it here.</p>
            <Link
              href="/generate"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Start Creating
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((model) => (
              <div
                key={model.id}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden group"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gray-800 relative">
                  {model.thumbnail ? (
                    <img
                      src={model.thumbnail}
                      alt={model.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      No preview
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  {renamingId === model.id ? (
                    <div className="flex gap-2">
                      <input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleRename(model.id)}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm"
                        autoFocus
                      />
                      <button
                        onClick={() => handleRename(model.id)}
                        className="text-green-400 hover:text-green-300 text-sm"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <h3 className="text-white font-medium truncate">{model.name}</h3>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(model.updatedAt).toLocaleDateString()}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    <Link
                      href={`/generate?modelId=${model.id}`}
                      className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open
                    </Link>
                    <button
                      onClick={() => {
                        setRenamingId(model.id);
                        setRenameValue(model.name);
                      }}
                      className="flex items-center gap-1 text-gray-400 hover:text-white text-sm"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Rename
                    </button>
                    {deleteConfirm === model.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(model.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-gray-400 hover:text-white text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(model.id)}
                        className="flex items-center gap-1 text-gray-400 hover:text-red-400 text-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: overhaul dashboard with real model data and subscription management"
```

---

### Task 18: Add auto-save to generate page

**Files:**
- Modify: `src/app/generate/page.tsx`

- [ ] **Step 1: Add debounced auto-save effect**

Add this effect to the generate page component, after the save function:

```ts
// Auto-save every 30 seconds if model has been saved once and scene changed
const lastSavedRef = useRef<string>("");

useEffect(() => {
  if (!modelId || !session) return;

  const interval = setInterval(() => {
    const currentScene = JSON.stringify(sceneToJSON(objects));
    if (currentScene !== lastSavedRef.current) {
      lastSavedRef.current = currentScene;
      handleSave();
    }
  }, 30000);

  return () => clearInterval(interval);
}, [modelId, session, objects]);
```

- [ ] **Step 2: Commit**

```bash
git add src/app/generate/page.tsx
git commit -m "feat: add 30-second auto-save for persisted models"
```

---

## Chunk 5: Export Gating & Vercel Deployment

### Task 19: Gate export formats behind premium

**Files:**
- Modify: `src/app/generate/page.tsx`

- [ ] **Step 1: Update export buttons to check plan**

In the export dropdown area of the generate page, wrap the OBJ and GLTF export buttons with plan checks:

```tsx
// STL export — always available
<button onClick={() => handleExport("stl")}>
  Export STL
</button>

// OBJ export — premium only
<button
  onClick={() => {
    if (session?.user?.plan !== "PREMIUM") {
      setUpgradeFeature("OBJ export");
      setShowUpgradeModal(true);
      return;
    }
    handleExport("obj");
  }}
  className="flex items-center gap-2"
>
  Export OBJ
  {session?.user?.plan !== "PREMIUM" && (
    <Crown className="w-3 h-3 text-yellow-400" />
  )}
</button>

// GLTF export — premium only
<button
  onClick={() => {
    if (session?.user?.plan !== "PREMIUM") {
      setUpgradeFeature("GLTF export");
      setShowUpgradeModal(true);
      return;
    }
    handleExport("gltf");
  }}
  className="flex items-center gap-2"
>
  Export GLTF
  {session?.user?.plan !== "PREMIUM" && (
    <Crown className="w-3 h-3 text-yellow-400" />
  )}
</button>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/generate/page.tsx
git commit -m "feat: gate OBJ and GLTF export behind premium plan"
```

---

### Task 20: Add user plan polling endpoint

**Files:**
- Create: `src/app/api/user/plan/route.ts`

- [ ] **Step 1: Create plan check endpoint**

Create `src/app/api/user/plan/route.ts`:

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, dailyGenerations: true, lastGenerationDate: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Calculate remaining generations for free users
  const now = new Date();
  const lastDate = user.lastGenerationDate;
  const isNewDay =
    !lastDate ||
    lastDate.toISOString().slice(0, 10) !== now.toISOString().slice(0, 10);

  return NextResponse.json({
    plan: user.plan,
    generationsUsed: isNewDay ? 0 : user.dailyGenerations,
    generationsLimit: user.plan === "FREE" ? 10 : null,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/user/plan/route.ts
git commit -m "feat: add user plan check endpoint for dashboard polling"
```

---

### Task 21: Prepare for Vercel deployment

**Files:**
- Modify: `.github/workflows/deploy.yml` (add note about deprecation)
- Create: `vercel.json` (optional config)

- [ ] **Step 1: Add Prisma generate to build script**

Update `package.json` scripts:

```json
"scripts": {
  "dev": "next dev",
  "build": "prisma generate && next build",
  "start": "next start",
  "lint": "next lint",
  "postinstall": "prisma generate"
}
```

- [ ] **Step 2: Add vercel.json for Stripe webhook raw body**

Create `vercel.json`:

```json
{
  "functions": {
    "src/app/api/stripe/webhook/route.ts": {
      "maxDuration": 30
    }
  }
}
```

- [ ] **Step 3: Update .gitignore**

Add to `.gitignore`:

```
# Vercel
.vercel
```

- [ ] **Step 4: Commit**

```bash
git add package.json vercel.json .gitignore
git commit -m "chore: prepare build scripts and config for Vercel deployment"
```

---

### Task 22: Final integration verification

- [ ] **Step 1: Start dev server and test auth flow**

```bash
npm run dev
```

Test:
1. Navigate to `/register` — create account with email/password
2. Check for verification email (or check VerificationToken in Prisma Studio)
3. Navigate to `/login` — sign in with credentials
4. Verify Navbar shows avatar and dropdown
5. Navigate to `/generate` — verify save button appears
6. Save a model — verify it appears in `/dashboard`
7. Navigate to `/pricing` — verify "Current Plan" badge on Free tier

- [ ] **Step 2: Test premium flow**

Test:
1. Use admin curl to upgrade:
   ```bash
   curl -X PATCH http://localhost:3000/api/admin/user-plan \
     -H "Content-Type: application/json" \
     -H "x-admin-secret: YOUR_SECRET" \
     -d '{"userId": "USER_ID", "plan": "PREMIUM"}'
   ```
2. Refresh page — verify plan shows "Premium" in navbar dropdown
3. Verify OBJ/GLTF export buttons work without upgrade modal
4. Verify AI generation doesn't show rate limit

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: integration fixes from end-to-end testing"
```

---

### Task 23: Deploy to Vercel

- [ ] **Step 1: Connect repo to Vercel**

```bash
npx vercel link
```

Or connect via Vercel dashboard → Import Git Repository → Select `Electro558/spacevision`

- [ ] **Step 2: Set environment variables in Vercel dashboard**

Add all env vars from `.env.example` to the Vercel project settings.

- [ ] **Step 3: Provision Vercel Postgres**

In Vercel dashboard: Storage → Create → Postgres → Connect to project.
This auto-adds `POSTGRES_*` env vars.

- [ ] **Step 4: Deploy**

```bash
npx vercel --prod
```

Or push to main — Vercel auto-deploys.

- [ ] **Step 5: Run migration on production**

```bash
npx prisma migrate deploy
```

- [ ] **Step 6: Verify production deployment**

Navigate to the Vercel URL and test:
1. Homepage loads
2. Login/register works
3. Generate page loads
4. Save model works
5. Dashboard shows saved models

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "chore: Vercel deployment configuration complete"
```
