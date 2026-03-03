import { defineTool, type ToolDefinition } from "@jchaffin/voicekit";

export interface ToolsConfig {
  apiBaseUrl?: string;
}

export function createTools(config: ToolsConfig = {}): ToolDefinition[] {
  const base = config.apiBaseUrl || "";

  const search_knowledge = defineTool({
    name: "search_knowledge",
    description:
      "Search the candidate's knowledge base for in-depth information about their work experience, projects, and skills. " +
      "Contains documents, notes, and detailed materials from past roles. " +
      "Use this to find specific details about what the candidate built, technologies used, and outcomes achieved.",
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
        const res = await fetch(`${base}/api/knowledge`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, company, limit: 8 }),
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
          query,
          company: company || "all",
          resultsFound: data.resultsFound || 0,
          results: data.results || [],
        };
      } catch {
        return { success: false, error: "Knowledge search failed" };
      }
    },
  });

  const research_company = defineTool({
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
        const res = await fetch(`${base}/api/research`, {
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

  const get_job_requirements = defineTool({
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

  return [search_knowledge, research_company, get_job_requirements] as ToolDefinition[];
}
