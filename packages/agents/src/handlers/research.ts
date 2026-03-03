const PERPLEXITY_API = "https://api.perplexity.ai/chat/completions";

export interface ResearchConfig {
  perplexityApiKey: string;
}

export interface ResearchInput {
  company?: string;
  role?: string;
  jobDescription?: string;
}

export interface ResearchResult {
  research: string;
  citations: string[];
}

export async function researchCompany(
  config: ResearchConfig,
  input: ResearchInput,
): Promise<ResearchResult> {
  if (!input.company && !input.role) {
    throw new Error("company or role is required");
  }

  const jdSnippet = input.jobDescription
    ? `\n\nJob description excerpt:\n${input.jobDescription.slice(0, 1500)}`
    : "";

  const prompt = `Research the following for an upcoming job interview:

Company: ${input.company || "Not specified"}
Role: ${input.role || "Not specified"}${jdSnippet}

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
      Authorization: `Bearer ${config.perplexityApiKey}`,
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
    throw new Error(`Perplexity API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return {
    research: data.choices?.[0]?.message?.content || "",
    citations: data.citations || [],
  };
}
