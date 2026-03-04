import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getRequiredSession, unauthorizedResponse } from "@/lib/api/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET: returns whether the current user has a password set (for OAuth vs credentials). */
export async function GET() {
  try {
    const session = await getRequiredSession();
    const userId = session.user?.id;
    if (!userId) return unauthorizedResponse();

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ hasPassword: !!user.password });
  } catch {
    return unauthorizedResponse();
  }
}

/** PATCH: set or change password. OAuth users can set; credential users must send currentPassword to change. */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getRequiredSession();
    const userId = session.user?.id;
    if (!userId) return unauthorizedResponse();

    const body = await request.json();
    const { currentPassword, newPassword } = body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!newPassword || typeof newPassword !== "string") {
      return NextResponse.json(
        { error: "New password is required" },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.password) {
      if (!currentPassword || typeof currentPassword !== "string") {
        return NextResponse.json(
          { error: "Current password is required to change password" },
          { status: 400 },
        );
      }
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 },
        );
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true });
  } catch {
    return unauthorizedResponse();
  }
}
