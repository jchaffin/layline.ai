import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/api/openai";

/**
 * POST /api/coach
 *
 * Single coach API: send conversation transcript + context, get a suggested answer.
 * Body: { transcript: Array<{ role: "user"|"assistant", text: string }>, context?: { companyName?, roleTitle?, jobDescription?, resumeSummary?, companyResearch? } }
 * Returns: { suggestion: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { transcript, context } = await request.json();

    if (!transcript || !Array.isArray(transcript)) {
      return NextResponse.json(
        { error: "transcript required (array of { role, text })" },
        { status: 400 }
      );
    }

    const contextBlock = [
      context?.companyName && `Company: ${context.companyName}`,
      context?.roleTitle && `Role: ${context.roleTitle}`,
      context?.jobDescription &&
        `Job Description:\n${context.jobDescription}`,
      context?.resumeSummary &&
        `Candidate Resume:\n${context.resumeSummary}`,
      context?.companyResearch &&
        `Company Research:\n${context.companyResearch}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      {
        role: "system",
        content: `You are the candidate in a live job interview. The interviewer just asked a question. Write the answer the candidate should say OUT LOUD, in first person.

<candidate_background>
${contextBlock}
</candidate_background>

RULES:
- Write the ACTUAL ANSWER in first person ("I built...", "At my last role, I...", "My approach would be...").
- Pull from the candidate's real resume above. Mention specific companies, projects, technologies, and quantified results.
- 3-6 sentences. Concise but substantive.
- Write it as natural speech they can read and say out loud. No bullet points, no markdown.
- Do NOT give advice, tips, coaching, or feedback. Do NOT say "great answer" or "you should mention X". JUST the answer.
- If the question is "tell me about yourself", write a tight intro from their resume highlights.
- If it's technical, answer technically using their project experience.
- If it's behavioral ("tell me about a time..."), pick a specific story from the resume and tell it with concrete details.`,
      },
    ];

    for (const turn of transcript) {
      messages.push({
        role: turn.role === "assistant" ? "user" : "assistant",
        content: turn.text,
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 400,
      temperature: 0.7,
    });

    const suggestion =
      completion.choices[0]?.message?.content?.trim() ?? "";

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error("[api/coach] error:", error);
    return NextResponse.json(
      { error: "Coach request failed", details: String(error) },
      { status: 500 }
    );
  }
}
