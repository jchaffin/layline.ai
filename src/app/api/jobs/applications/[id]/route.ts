import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    const body = await request.json();

    const existing = await db.jobApplication.findUnique({ where: { id } });
    if (!existing || (existing.userId && existing.userId !== userId)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await db.jobApplication.update({
      where: { id },
      data: {
        ...(body.jobTitle !== undefined && { jobTitle: body.jobTitle }),
        ...(body.company !== undefined && { company: body.company }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.jobUrl !== undefined && { jobUrl: body.jobUrl || "" }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.salaryRange !== undefined && { salaryRange: body.salaryRange }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.analysis !== undefined && { analysis: body.analysis }),
        lastUpdated: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    const existing = await db.jobApplication.findUnique({ where: { id } });
    if (!existing || (existing.userId && existing.userId !== userId)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.jobApplication.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting application:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
