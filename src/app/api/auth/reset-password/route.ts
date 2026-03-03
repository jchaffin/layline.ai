import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const user = await db.user.findUnique({ where: { email: trimmedEmail } });

    if (!user || !user.password) {
      return NextResponse.json({ success: true });
    }

    await db.passwordResetToken.deleteMany({ where: { email: trimmedEmail } });

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await db.passwordResetToken.create({
      data: { email: trimmedEmail, token, expires },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`;
    console.log(`[Password Reset] ${trimmedEmail}: ${resetUrl}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.expires < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword },
    });

    await db.passwordResetToken.delete({ where: { token } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
