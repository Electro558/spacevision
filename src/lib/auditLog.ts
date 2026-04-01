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
