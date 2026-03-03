import { NextRequest, NextResponse } from "next/server";

const PERPLEXITY_API = "https://api.perplexity.ai/chat/completions";

export async function POST(request: NextRequest) {
  try {
    const { company, role, jobDescription } = await request.json();

    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Perplexity API key not configured" },
        { status: 500 }
      );
    }

    if (!company && !role) {
      return NextResponse.json(
        { error: "company or role is required" },
        { status: 400 }
      );
    }

    const jdSnippet = jobDescription
      ? `\n\nJob description excerpt:\n${jobDescription.slice(0, 1500)}`
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

    if (!res.ok) {
      const text = await res.text();
      console.error("Perplexity API error:", res.status, text);
      return NextResponse.json(
        { error: `Perplexity API error: ${res.status}` },
        { status: 500 }
      );
    }

    const data = await res.json();
    const research = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];

    return NextResponse.json({ research, citations });
  } catch (error) {
    console.error("Research error:", error);
    return NextResponse.json(
      { error: "Research failed", details: String(error) },
      { status: 500 }
    );
  }
}
