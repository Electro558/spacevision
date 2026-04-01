import { Plan } from "@/generated/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      plan: Plan;
      emailVerified: Date | null;
      status: string;
      impersonatingUserId?: string;
      impersonatingUserName?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    plan: Plan;
    emailVerified: Date | null;
    status: string;
    impersonatingUserId?: string;
    impersonatingUserName?: string;
  }
}
