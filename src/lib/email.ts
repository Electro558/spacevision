import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[Email] RESEND_API_KEY is not set — emails will not be sent");
    return null;
  }
  return new Resend(key);
}

/**
 * Get the "from" address — use verified domain if available, otherwise Resend's default.
 * Resend lets you send from "onboarding@resend.dev" without domain verification (free tier).
 * For production, set EMAIL_FROM env var to your verified domain sender.
 */
function getFromAddress(): string {
  return process.env.EMAIL_FROM || "SpaceVision <onboarding@resend.dev>";
}

function getBaseUrl(): string {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) {
    return { success: false, error: "Email service not configured" };
  }

  const baseUrl = getBaseUrl();
  const verifyUrl = `${baseUrl}/api/verify-email?token=${token}`;

  try {
    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to: email,
      subject: "Verify your SpaceVision account",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #1a1a2e; font-size: 24px; margin: 0;">Welcome to SpaceVision</h1>
          </div>
          <p style="color: #333; font-size: 16px; line-height: 1.5;">
            Click the button below to verify your email address and start creating 3D models:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Verify My Email
            </a>
          </div>
          <p style="color: #666; font-size: 13px; line-height: 1.5;">
            This link expires in 24 hours. If you didn't create a SpaceVision account, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
          <p style="color: #999; font-size: 12px;">
            If the button doesn't work, copy and paste this link into your browser:<br />
            <a href="${verifyUrl}" style="color: #6366f1; word-break: break-all;">${verifyUrl}</a>
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("[Email] Resend error:", error);
      return { success: false, error: error.message || "Failed to send email" };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[Email] Send error:", err);
    return { success: false, error: err.message || "Failed to send email" };
  }
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) {
    return { success: false, error: "Email service not configured" };
  }

  const baseUrl = getBaseUrl();
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  try {
    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to: email,
      subject: "Reset your SpaceVision password",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #1a1a2e; font-size: 24px; text-align: center;">Reset Your Password</h1>
          <p style="color: #333; font-size: 16px; line-height: 1.5;">
            We received a request to reset your password. Click below to set a new one:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 13px;">
            This link expires in 1 hour. If you didn't request a reset, ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
