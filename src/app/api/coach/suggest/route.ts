import { NextRequest } from "next/server";
import { openai } from "@/lib/api/openai";

export async function POST(request: NextRequest) {
  try {
    const { transcript, context } = await request.json();

    if (!transcript || !Array.isArray(transcript)) {
      return new Response("transcript required", { status: 400 });
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

    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      stream: true,
      max_tokens: 400,
      temperature: 0.7,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
              controller.enqueue(encoder.encode(delta));
            }
          }
        } catch (err) {
          console.error("[coach/suggest] stream error:", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("[coach/suggest] error:", error);
    return new Response("Internal error", { status: 500 });
  }
}
