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
