import { NextRequest, NextResponse } from "next/server";

const PERPLEXITY_API = "https://api.perplexity.ai/chat/completions";

export async function POST(request: NextRequest) {
  try {
    let body: { company?: string; role?: string; jobDescription?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }
    const { company, role, jobDescription } = body;

    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      console.error("Research: PERPLEXITY_API_KEY is not set");
      return NextResponse.json(
        { error: "Research is not configured. Set PERPLEXITY_API_KEY in environment." },
        { status: 503 }
      );
    }

    if (!company && !role) {
      return NextResponse.json(
        { error: "company or role is required" },
        { status: 400 }
      );
    }

    const jdSnippet = jobDescription
      ? `\n\nJob description excerpt:\n${String(jobDescription).slice(0, 1500)}`
      : "";

    const prompt = `Research the following for an upcoming job interview:

Company: ${company || "Not specified"}
Role: ${role || "Not specified"}${jdSnippet}

Provide a concise briefing covering:
1. Company overview — what they do, stage/size, recent news or product launches
2. Engineering culture and tech stack (if available)
3. What they typically look for in candidates for this type of role
4. Common interview topics or formats they use
5. Any recent developments that could come up in conversation

Keep it factual and concise. Focus on information that would help a candidate prepare.`;

    const res = await fetch(PERPLEXITY_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content:
              "You are a career research assistant. Provide concise, factual briefings to help candidates prepare for interviews.",
          },
          { role: "user", content: prompt },
        ],
        search_recency_filter: "month",
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      let errDetail: string;
      try {
        const parsed = JSON.parse(text);
        errDetail =
          parsed?.error?.message ||
          parsed?.error ||
          (typeof parsed?.message === "string" ? parsed.message : text?.slice(0, 200) || res.statusText);
      } catch {
        errDetail = text?.slice(0, 200) || res.statusText;
      }
      console.error("Perplexity API error:", res.status, errDetail);
      return NextResponse.json(
        {
          error: "Research service error",
          details: res.status === 401
            ? "Invalid or missing Perplexity API key"
            : res.status === 429
              ? "Rate limit exceeded. Try again shortly."
              : String(errDetail),
        },
        { status: res.status >= 400 && res.status < 500 ? res.status : 502 }
      );
    }

    let data: { choices?: Array<{ message?: { content?: string } }>; citations?: string[] };
    try {
      data = JSON.parse(text);
    } catch {
      console.error("Research: invalid JSON from Perplexity", text?.slice(0, 200));
      return NextResponse.json(
        { error: "Research service returned invalid response" },
        { status: 502 }
      );
    }
    const research = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];

    return NextResponse.json({ research, citations });
  } catch (error) {
    console.error("Research error:", error);
    return NextResponse.json(
      { error: "Research failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
