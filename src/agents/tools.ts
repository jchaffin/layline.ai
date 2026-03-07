import { defineTool, type ToolDefinition } from "@jchaffin/voicekit";

async function callKnowledgeApi(body: Record<string, unknown>) {
  const res = await fetch("/api/knowledge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return {
      success: false,
      error: `Knowledge search failed (${res.status})`,
    };
  }

  const data = await res.json();
  return {
    success: true,
    resultsFound: data.resultsFound || 0,
    overview: data.overview || "",
    results: data.results || [],
  };
}

/**
 * Search the candidate's private work experience knowledge base for relevant
 * projects, metrics, and role-specific details.
 */
export const search_work_experience = defineTool({
  name: "search_work_experience",
  description:
    "Search the candidate's private work-experience knowledge base for in-depth information about projects, metrics, roles, and past work. " +
    "Use this to find specific details about what the candidate built, technologies used, and measurable outcomes. " +
    "For broad background questions, this tool may also return an `overview` field with a concise high-level summary grounded in the retrieved documents.",
  parameters: {
    query: {
      type: "string",
      description:
        'Search query (e.g., "distributed systems experience", "React performance optimization", "team leadership")',
    },
    company: {
      type: "string",
      description: "Optional: filter by company name",
    },
  },
  required: ["query"],
  execute: async ({ query, company }: { query: string; company?: string }) => {
    try {
      const data = await callKnowledgeApi({
        corpus: "work_experience",
        query,
        company,
        limit: 8,
      });

      return {
        ...data,
        query,
        company: company || "all",
      };
    } catch {
      return { success: false, error: "Knowledge search failed" };
    }
  },
});

/**
 * Search the shared interview materials knowledge base for algorithms, coding,
 * and system design prep material.
 */
export const search_interview_materials = defineTool({
  name: "search_interview_materials",
  description:
    "Search the shared interview-prep knowledge base for algorithms, coding, and system-design materials. " +
    "Use this for conceptual guidance, frameworks, tradeoffs, and technical refreshers. " +
    "This tool may also return an `overview` field when the query is broad and benefits from a synthesized summary.",
  parameters: {
    query: {
      type: "string",
      description:
        'Search query (e.g., "binary tree traversal patterns", "rate limiter design", "dynamic programming interview tips")',
    },
    topic: {
      type: "string",
      description:
        "Optional: narrow to a topic such as algorithms, systems-design, or coding",
    },
  },
  required: ["query"],
  execute: async ({ query, topic }: { query: string; topic?: string }) => {
    try {
      const data = await callKnowledgeApi({
        corpus: "interview_materials",
        query,
        topic,
        limit: 8,
      });

      return {
        ...data,
        query,
        topic: topic || "all",
      };
    } catch {
      return { success: false, error: "Knowledge search failed" };
    }
  },
});

/**
 * Research a company in real-time via Perplexity. Returns a briefing on
 * the company, culture, and what they look for in candidates.
 */
export const research_company = defineTool({
  name: "research_company",
  description:
    "Research a company in real-time using web search. Returns a briefing on the company, " +
    "their engineering culture, recent news, and what they look for in candidates. " +
    "Use this to ask informed questions or reference real company context.",
  parameters: {
    company: {
      type: "string",
      description: "Company name to research",
    },
    role: {
      type: "string",
      description: "Role title for context",
    },
  },
  required: ["company"],
  execute: async ({ company, role }: { company: string; role?: string }) => {
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, role }),
      });

      if (!res.ok) {
        return {
          success: false,
          error: `Research failed (${res.status})`,
        };
      }

      const data = await res.json();
      return {
        success: true,
        company,
        research: data.research || "",
        citations: data.citations || [],
      };
    } catch {
      return { success: false, error: "Research failed" };
    }
  },
});

/**
 * Returns the parsed job description analysis. The JD is already in the agent's
 * context, but this tool lets the agent explicitly re-read the requirements.
 */
export const get_job_requirements = defineTool({
  name: "get_job_requirements",
  description:
    "Get the analyzed job requirements for the current interview. Returns required skills, " +
    "responsibilities, qualifications, and experience level extracted from the job description.",
  parameters: {},
  execute: () => {
    if (typeof window === "undefined") {
      return { success: false, error: "Not available server-side" };
    }

    try {
      const stored = localStorage.getItem("currentJobAnalysis");
      if (!stored) {
        return {
          success: true,
          available: false,
          message: "No job analysis available for this interview.",
        };
      }
      const { analysis } = JSON.parse(stored);
      return { success: true, available: true, ...analysis };
    } catch {
      return { success: false, error: "Failed to read job analysis" };
    }
  },
});

export const shared_tools: ToolDefinition[] = [
  search_interview_materials,
  research_company,
  get_job_requirements,
] as ToolDefinition[];
