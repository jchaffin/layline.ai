import { NextResponse } from "next/server";
import { createCoachSessionKey } from "@layline/agents/handlers";

export async function POST() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 },
      );
    }

    const result = await createCoachSessionKey({ openaiApiKey: apiKey });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Coach session handler error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 },
    );
  }
}
