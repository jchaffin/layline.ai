import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    const body = await request.json();
    const { jobTitle, company, jobUrl, status, notes, location, salaryRange, description, analysis } = body;

    if (!jobTitle || !company) {
      return NextResponse.json({ error: "jobTitle and company are required" }, { status: 400 });
    }

    const app = await db.jobApplication.create({
      data: {
        ...(userId ? { user: { connect: { id: userId } } } : {}),
        jobTitle,
        company,
        jobUrl: jobUrl || "",
        status: status || "applied",
        notes,
        location,
        salaryRange,
        description: description || null,
        analysis: analysis || undefined,
      },
    });

    return NextResponse.json(app, { status: 201 });
  } catch (error) {
    console.error("Error creating application:", error);
    return NextResponse.json({ error: "Failed to create application" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    const applications = await db.jobApplication.findMany({
      where: userId
        ? { OR: [{ userId }, { userId: null }] }
        : { userId: null },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}
