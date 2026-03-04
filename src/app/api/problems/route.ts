import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const difficulty = searchParams.get("difficulty");
    const tags = searchParams.getAll("tag");

    const where: Record<string, unknown> = {};
    if (difficulty) where.difficulty = difficulty;
    if (tags.length > 0) where.tags = { hasSome: tags };

    const problems = await db.codingProblem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        difficulty: true,
        tags: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ problems });
  } catch (err) {
    console.error("[GET /api/problems]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load problems", problems: [] },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, slug, description, difficulty, tags, testCases, starterCode, hints } = body;

    if (!title || !slug || !description || !testCases) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const problem = await db.codingProblem.create({
      data: {
        title,
        slug,
        description,
        difficulty: difficulty || "medium",
        tags: tags || [],
        testCases,
        starterCode: starterCode || {},
        hints: hints || [],
      },
    });

    return NextResponse.json({ problem }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "A problem with this slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
