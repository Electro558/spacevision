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
