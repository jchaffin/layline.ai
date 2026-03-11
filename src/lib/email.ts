import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Layline <onboarding@resend.dev>";

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not set, skipping password reset email");
    return { ok: false, error: "Email not configured" };
  }

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Reset your Layline password",
    html: `
      <p>You requested a password reset for your Layline account.</p>
      <p><a href="${resetUrl}" style="color: #2563eb; text-decoration: underline;">Reset your password</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    `,
  });

  if (error) {
    console.error("[Email] Password reset send failed:", error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
