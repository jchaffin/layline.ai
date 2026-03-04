import { NextRequest, NextResponse } from "next/server";
import { getRequiredSession, unauthorizedResponse } from "@/lib/api/auth";
import { db } from "@/lib/db";

/** GET /api/session/context – return current user's stored interview context (for Electron / coach). */
export async function GET() {
  try {
    const session = await getRequiredSession();
    const userId = session.user?.id;
    if (!userId) return unauthorizedResponse();

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { interviewContext: true } as { interviewContext: true },
    });

    const context = (user as { interviewContext?: unknown } | null)?.interviewContext ?? null;
    return NextResponse.json({ context });
  } catch {
    return unauthorizedResponse();
  }
}

/** PUT /api/session/context – store interview context for the current user. */
export async function PUT(request: NextRequest) {
  try {
    const session = await getRequiredSession();
    const userId = session.user?.id;
    if (!userId) return unauthorizedResponse();

    const body = await request.json();
    const context = {
      mode: body.mode,
      companyName: body.companyName,
      roleTitle: body.roleTitle,
      jobDescription: body.jobDescription,
      resumeSummary: body.resumeSummary,
      companyResearch: body.companyResearch,
    };

    await db.user.update({
      where: { id: userId },
      data: { interviewContext: context as object },
    });

    return NextResponse.json({ success: true });
  } catch {
    return unauthorizedResponse();
  }
}
