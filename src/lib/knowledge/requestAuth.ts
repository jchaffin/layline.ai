import type { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/api/auth";

export async function canManageKnowledge(request: NextRequest): Promise<{
  authorized: boolean;
  userId?: string;
}> {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return { authorized: true };
  }

  const session = await getSessionFromRequest(request).catch(() => null);
  if (session?.user?.id) {
    return { authorized: true, userId: session.user.id };
  }

  return { authorized: false };
}
