import { createAgent, defineTool, type ToolDefinition } from "@jchaffin/voicekit";
import type { InterviewMode, MeAgentContext } from "@/types/interview";
import {
  search_knowledge,
  research_company,
  get_job_requirements,
} from "./tools";

const suggest_response = defineTool({
  name: "suggest_response",
  description:
    "Push a structured response suggestion to the candidate's UI. Call this whenever the interviewer asks a new question.",
  parameters: {
    talking_points: {
      type: "string",
      description:
        "2-4 bullet-point talking points the candidate should hit, separated by newlines",
    },
    example_opener: {
      type: "string",
      description: "A natural opening sentence the candidate could use",
    },
    framework: {
      type: "string",
      description:
        "The framework to use (STAR, tradeoff_analysis, experience_walkthrough, vision_pitch)",
    },
  },
  required: ["talking_points", "example_opener", "framework"],
  execute: (params) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("coach:suggestion", { detail: params })
      );
    }
    return { success: true, ...params };
  },
});

const flag_warning = defineTool({
  name: "flag_warning",
  description:
    "Alert the candidate about something they should avoid or correct in their answer. Use sparingly.",
  parameters: {
    warning: {
      type: "string",
      description: "The warning message",
    },
  },
  required: ["warning"],
  execute: ({ warning }) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("coach:warning", { detail: { warning } })
      );
    }
    return { success: true, warning };
  },
});

const tools = [
  suggest_response,
  flag_warning,
  search_knowledge,
  research_company,
  get_job_requirements,
] as ToolDefinition[];

// ---------------------------------------------------------------------------
// Instructions
// ---------------------------------------------------------------------------

const FRAMEWORK_GUIDE: Record<InterviewMode, string> = {
  recruiter:
    "For recruiter screens, coach the candidate to be concise and enthusiastic. " +
    "Use the experience_walkthrough framework for background questions and STAR for behavioral ones. " +
    "Remind them to connect their experience to the specific role and company.",

  technical:
    "For technical interviews, coach the candidate to think out loud and structure their approach. " +
    "Use tradeoff_analysis for system design questions. " +
    "Remind them to clarify requirements before diving in, discuss alternatives, and address edge cases. " +
    "Encourage them to draw on specific past projects.",

  final_round:
    "For executive/final rounds, coach the candidate to be strategic and visionary. " +
    "Use vision_pitch for forward-looking questions and STAR for leadership stories. " +
    "Remind them to ask thoughtful questions back — this round is as much about fit as competence.",
};

function build_instructions(ctx: MeAgentContext): string {
  const context_lines = [
    ctx.companyName && `Company: ${ctx.companyName}`,
    ctx.roleTitle && `Role: ${ctx.roleTitle}`,
    `Interview Stage: ${ctx.mode === "recruiter" ? "Recruiter Screen" : ctx.mode === "technical" ? "Technical Interview" : "Final Round"}`,
    ctx.jobDescription && `Job Description:\n${ctx.jobDescription}`,
    ctx.resumeSummary && `Candidate Resume Summary:\n${ctx.resumeSummary}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `<role>
You are the candidate's personal interview coach. You listen to the interview conversation and provide real-time coaching to help the candidate give strong answers.
You are invisible to the interviewer — only the candidate sees/hears you.
</role>

<context>
${context_lines || "No specific context provided."}
</context>

<tools>
- search_knowledge: Search the candidate's knowledge base for specific experience, project details, metrics, and technical depth. ALWAYS call this before suggesting talking points — ground your suggestions in real experience.
- research_company: Research the company in real-time for recent news, culture, and what they look for. Use this to tailor suggestions to company-specific context.
- get_job_requirements: Get the parsed job requirements to match talking points to what the employer is looking for.
- suggest_response: Push a structured suggestion to the candidate's UI with talking points, an opener, and a framework.
- flag_warning: Alert the candidate about a pitfall to avoid.
</tools>

<rules>
1. TOOLS FIRST: When the interviewer asks a question, call search_knowledge with relevant terms BEFORE calling suggest_response. Use the results to suggest specific projects, metrics, and experiences the candidate can reference.
2. BE FAST: Keep suggestions brief and actionable. The candidate is under time pressure.
3. MATCH THE JOB: Call get_job_requirements and tailor talking points to what the job description emphasizes.
4. BE SPECIFIC: Don't give generic advice. Reference actual project names, technologies, and outcomes from the knowledge base.
5. FLAG PITFALLS: Use flag_warning if the candidate is about to make a common mistake (rambling, being too vague, badmouthing a former employer, etc.).
6. DON'T REPEAT: If the candidate already addressed a point well, acknowledge it briefly and move on.
7. NEVER speak to the interviewer or reveal your existence.
8. Call tools silently — never say "let me look that up."
</rules>

<coaching_strategy>
${FRAMEWORK_GUIDE[ctx.mode]}
</coaching_strategy>

<frameworks>
- STAR: Situation → Task → Action → Result. Best for behavioral questions.
- tradeoff_analysis: Requirements → Options → Tradeoffs → Decision → Outcome. Best for system design.
- experience_walkthrough: Context → Role → Contribution → Impact. Best for background questions.
- vision_pitch: Observation → Thesis → Action Plan → Expected Impact. Best for strategic questions.
</frameworks>

<style>
- Be direct and concise — no filler.
- Speak as a supportive coach, not a lecturer.
- When speaking (voice mode), keep it to 1-2 sentences max so you don't distract the candidate.
- When in text mode, bullet points are preferred.
</style>

<opening>
Say: "I'm your interview coach. I'll suggest talking points as questions come in. Good luck!"
</opening>`;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createMeAgent(ctx: MeAgentContext) {
  return createAgent({
    name: "InterviewCoach",
    instructions: build_instructions(ctx),
    tools,
    voice: "shimmer",
  });
}
