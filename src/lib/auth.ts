import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { Plan } from "@/generated/prisma";

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
      allowDangerousEmailAccountLinking: true,
      checks: ["none"],
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      checks: ["none"],
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
      // Check if user is banned
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email! },
        select: { password: true, status: true, emailVerified: true },
      });

      if (dbUser?.status === "BANNED") {
        return false;
      }

      if (account?.provider === "credentials") {
        if (!dbUser?.password) return false;
      }

      // Auto-verify email for OAuth users (Google/GitHub already verify emails)
      if (account?.provider !== "credentials" && dbUser && !dbUser.emailVerified) {
        await prisma.user.update({
          where: { email: user.email! },
          data: { emailVerified: new Date() },
        });
      }

      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: { id: true, plan: true, emailVerified: true, status: true },
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.plan = dbUser.plan;
          token.emailVerified = dbUser.emailVerified;
          token.status = dbUser.status;
        }
      }
      if (trigger === "update" && token.userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.userId as string },
          select: { plan: true, emailVerified: true, status: true },
        });
        if (dbUser) {
          token.plan = dbUser.plan;
          token.emailVerified = dbUser.emailVerified;
          token.status = dbUser.status;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.plan = token.plan as Plan;
        session.user.emailVerified = token.emailVerified as Date | null;
        session.user.status = token.status as string;
        session.user.impersonatingUserId = token.impersonatingUserId as string | undefined;
        session.user.impersonatingUserName = token.impersonatingUserName as string | undefined;
      }
      return session;
    },
  },
});
