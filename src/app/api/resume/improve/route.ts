import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI();

export async function POST(request: NextRequest) {
  try {
    const { section, content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }

    const prompts: Record<string, string> = {
      summary: `Improve this professional summary for a resume. Make it concise, impactful, and ATS-friendly. Keep it to 2-4 sentences. Use strong action-oriented language. Do not add any formatting markers or labels — output only the improved text.\n\nOriginal:\n${content}`,
      description: `Improve these job description bullet points for a resume. Make each bullet start with a strong action verb, include quantifiable metrics where possible, and be concise. Keep the same number of bullets. Use "- " prefix for each bullet. Do not add any formatting markers or labels — output only the improved bullets.\n\nOriginal:\n${content}`,
    };

    const prompt = prompts[section] || prompts.description;

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert resume writer. Output only the improved text with no preamble." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const improvedContent = res.choices[0]?.message?.content?.trim();
    if (!improvedContent) {
      return NextResponse.json({ error: "No response" }, { status: 500 });
    }

    return NextResponse.json({ improvedContent });
  } catch (error) {
    console.error("Resume improve error:", error);
    return NextResponse.json({ error: "Failed to improve" }, { status: 500 });
  }
}
