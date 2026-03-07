import { NextRequest, NextResponse } from "next/server";
import { getRequiredSession, unauthorizedResponse } from "@/lib/api/auth";
import { assertResumeKeyOwnership, saveResumeObject } from "@/lib/resumeStorage";

export async function POST(request: NextRequest) {
  try {
    const session = await getRequiredSession(request);
    const userId = session.user?.id;
    if (!userId) return unauthorizedResponse();

    const { key, data } = await request.json();

    if (!key || !data) {
      return NextResponse.json({ error: "key and data required" }, { status: 400 });
    }

    assertResumeKeyOwnership(key, userId);

    await saveResumeObject({
      key,
      body: JSON.stringify(data),
      contentType: "application/json",
      metadata: { updatedAt: new Date().toISOString() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resume save error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
