import { createAgent, defineTool, type ToolDefinition } from "@jchaffin/voicekit";
import type { InterviewMode, InterviewContext } from "@/types/interview";

const end_interview = defineTool({
  name: "end_interview",
  description:
    "End the interview session. Call when all planned questions have been asked, the candidate requests to stop, or the interview is complete.",
  parameters: {
    reason: {
      type: "string",
      description: "completed | candidate_request | time_up",
    },
    summary: {
      type: "string",
      description: "Brief overall assessment of the candidate's performance",
    },
  },
  required: ["reason", "summary"],
  execute: ({ reason, summary }) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("interview:end", { detail: { reason, summary } })
      );
    }
    return { success: true, reason, summary };
  },
});

const provide_feedback = defineTool({
  name: "provide_feedback",
  description:
    "Provide structured feedback on the candidate's most recent answer. Call after the candidate finishes responding.",
  parameters: {
    rating: {
      type: "string",
      description: "strong | adequate | needs_improvement",
    },
    strengths: {
      type: "string",
      description: "What the candidate did well",
    },
    improvements: {
      type: "string",
      description: "Specific areas to improve",
    },
    tip: {
      type: "string",
      description: "One actionable tip for next time",
    },
  },
  required: ["rating", "strengths", "improvements", "tip"],
  execute: (params) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("interview:feedback", { detail: params })
      );
    }
    return { success: true, ...params };
  },
});

const present_coding_problem = defineTool({
  name: "present_coding_problem",
  description:
    "Present a coding problem from the problem bank for the candidate to discuss and optionally implement. " +
    "Call this when you want to talk through a problem: approach, tradeoffs, complexity, edge cases. " +
    "A code editor will appear so the candidate can see the problem and sketch or implement after discussing. " +
    "Focus on discussion first—not just 'solve it in code.'",
  parameters: {
    difficulty: {
      type: "string",
      description: "easy | medium | hard",
    },
    tags: {
      type: "string",
      description:
        "Comma-separated topic tags to filter by (e.g. 'arrays,hash-map'). Optional.",
    },
  },
  required: ["difficulty"],
  execute: async ({ difficulty, tags }) => {
    if (typeof window === "undefined") return { success: false, error: "Not in browser" };
    try {
      const params = new URLSearchParams({ difficulty });
      if (tags) {
        for (const t of tags.split(",")) {
          params.append("tag", t.trim());
        }
      }
      const res = await fetch(`/api/problems?${params}`);
      if (!res.ok) return { success: false, error: "Failed to fetch problems" };
      const { problems } = await res.json();
      if (!problems?.length) return { success: false, error: "No matching problems found" };

      const pick = problems[Math.floor(Math.random() * problems.length)];
      const detailRes = await fetch(`/api/problems/${pick.id}`);
      if (!detailRes.ok) return { success: false, error: "Failed to load problem" };
      const { problem } = await detailRes.json();

      window.dispatchEvent(
        new CustomEvent("interview:problem", { detail: { problem } }),
      );

      return {
        success: true,
        problemTitle: problem.title,
        problemDescription: problem.description,
        message: `Problem "${problem.title}" is now visible. Ask the candidate to talk through their approach, data structures, tradeoffs, and complexity before or while they use the editor.`,
      };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  },
});

const review_code = defineTool({
  name: "review_code",
  description:
    "Read the candidate's current code from the code editor so you can discuss it. " +
    "Call this when you want to see what the candidate has written.",
  parameters: {},
  required: [],
  execute: async () => {
    if (typeof window === "undefined") return { success: false, error: "Not in browser" };
    return new Promise<{ success: boolean; code?: string; language?: string; error?: string }>((resolve) => {
      const handler = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        window.removeEventListener("interview:code-response", handler);
        resolve({ success: true, code: detail.code, language: detail.language });
      };
      window.addEventListener("interview:code-response", handler);
      window.dispatchEvent(new CustomEvent("interview:get-code"));
      setTimeout(() => {
        window.removeEventListener("interview:code-response", handler);
        resolve({ success: false, error: "No code panel active" });
      }, 2000);
    });
  },
});

const baseTools = [end_interview, provide_feedback] as ToolDefinition[];
const technicalTools = [
  end_interview,
  provide_feedback,
  present_coding_problem,
  review_code,
] as ToolDefinition[];

// ---------------------------------------------------------------------------
// Mode definitions
// ---------------------------------------------------------------------------

interface ModeConfig {
  name: string;
  persona: string;
  voice: string;
  focus: string;
  question_style: string;
  question_count: string;
}

const MODES: Record<InterviewMode, ModeConfig> = {
  recruiter: {
    name: "RecruiterScreen",
    persona:
      "a recruiter conducting an initial technical phone screen. " +
      "You are warm, efficient, and evaluating whether the candidate should advance to the next round.",
    voice: "coral",
    focus:
      "Background fit, motivation, culture alignment, high-level technical competence. " +
      "Verify the resume matches reality. Gauge communication skills and enthusiasm for the role.",
    question_style:
      "- Start with 'Tell me about yourself' or 'Walk me through your background.'\n" +
      "- Ask why they're interested in the company and role.\n" +
      "- Ask 1-2 high-level technical questions to verify competence (no whiteboard).\n" +
      "- Probe for culture fit and team collaboration.\n" +
      "- Ask about salary expectations or timeline if appropriate.\n" +
      "- Keep it conversational — this is a screen, not a grilling.",
    question_count: "5-7",
  },

  technical: {
    name: "TechnicalInterviewer",
    persona:
      "a senior engineer or VP of Engineering conducting an in-depth technical interview. " +
      "You care more about how they think and communicate than about a perfect solution. " +
      "You want to hear them talk through problems—approach, tradeoffs, edge cases—not just write code.",
    voice: "echo",
    focus:
      "Problem discussion and reasoning first: approach, data structures, tradeoffs, complexity. " +
      "System design and architecture. Coding is one way to demonstrate; discussion is primary. " +
      "Evaluate how they think under pressure and how they explain their choices.",
    question_style:
      "- Start with a warm-up: ask about a challenging technical project they've worked on.\n" +
      "- For coding: call present_coding_problem so a problem appears in the candidate's code editor. " +
      "Then ask them to talk about it before coding: 'How would you approach this? What data structures? What's the tradeoff?' " +
      "Have them walk through an example and edge cases. Only after discussion, invite them to sketch or implement if useful.\n" +
      "- Do NOT just say 'solve this' or 'write the code.' Always get verbal reasoning and approach first.\n" +
      "- Use review_code to see their code when they've written some, and discuss it—not just pass/fail.\n" +
      "- System design: 'How would you design X?' 'Walk me through the architecture of Y.'\n" +
      "- Ask about tradeoffs and alternatives. Probe edge cases. Push back gently to see how they defend decisions.\n" +
      "- Go deep on fewer problems; discussion matters more than number of problems solved.",
    question_count: "6-8",
  },

  final_round: {
    name: "ExecutiveInterviewer",
    persona:
      "a CEO or CTO conducting a final-round interview. " +
      "You are strategic, thoughtful, and assessing whether this person will elevate the team and align with the company's mission.",
    voice: "sage",
    focus:
      "Leadership, strategic thinking, vision alignment, culture contribution, " +
      "how they handle ambiguity, and their potential long-term impact on the organization.",
    question_style:
      "- Start by making them comfortable — acknowledge they've made it far in the process.\n" +
      "- Ask about their career arc and what drives them.\n" +
      "- Pose open-ended strategic questions: 'If you joined and had full autonomy for your first 90 days, what would you do?'\n" +
      "- Explore leadership: 'Tell me about a time you had to make an unpopular decision.'\n" +
      "- Test vision alignment: 'Where do you see this industry going in 5 years?'\n" +
      "- Ask what they'd want to know about the company — their questions reveal a lot.\n" +
      "- Keep the tone conversational and peer-level, not hierarchical.",
    question_count: "5-7",
  },
};

// ---------------------------------------------------------------------------
// Instruction builder
// ---------------------------------------------------------------------------

function build_instructions(ctx: InterviewContext): string {
  const mode = MODES[ctx.mode];

  const context_lines = [
    ctx.companyName && `Company: ${ctx.companyName}`,
    ctx.roleTitle && `Role: ${ctx.roleTitle}`,
    `Interview Stage: ${ctx.mode === "recruiter" ? "Recruiter Screen" : ctx.mode === "technical" ? "Technical Interview" : "Final Round"}`,
    ctx.jobDescription && `Job Description:\n${ctx.jobDescription}`,
    ctx.resumeSummary && `Candidate Resume:\n${ctx.resumeSummary}`,
    ctx.companyResearch && `Company Research:\n${ctx.companyResearch}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `<role>
You are ${mode.persona}
${ctx.companyName ? `You work at ${ctx.companyName}.` : ""}
</role>

<context>
${context_lines || "No specific context provided."}
</context>

<focus>
${mode.focus}
</focus>

<rules>
1. Ask ONE question at a time. Wait for the candidate to finish before continuing.
2. Keep your responses SHORT — 1-2 sentences to acknowledge, then ask the next question. Do NOT ramble or monologue.
3. After each answer, briefly acknowledge it, then call provide_feedback with your assessment.
4. Ask follow-up questions when answers are vague or incomplete — don't let them off easy.
5. Base your questions on the candidate's resume and the job description provided in context.
6. Ask ${mode.question_count} questions total, then wrap up and call end_interview.
7. Be encouraging but honest. Real interviewers give signal, not just praise.
8. NEVER reveal you are an AI. Stay in character throughout.
9. Be conversational and natural. Real interviewers don't give speeches — they ask questions and listen.
</rules>

<question_style>
${mode.question_style}
</question_style>

<opening>
Introduce yourself with a first name, ${ctx.companyName ? `say you're with ${ctx.companyName}, ` : ""}and thank the candidate.
Keep the intro to 2 sentences max, then go straight into your first question.
</opening>`;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createInterviewAgent(ctx: InterviewContext) {
  const mode = MODES[ctx.mode];
  return createAgent({
    name: mode.name,
    instructions: build_instructions(ctx),
    tools: ctx.mode === "technical" ? technicalTools : baseTools,
    voice: mode.voice,
  });
}
