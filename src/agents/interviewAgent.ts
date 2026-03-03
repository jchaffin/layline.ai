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

const tools = [end_interview, provide_feedback] as ToolDefinition[];

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
      "You are rigorous, precise, and genuinely curious about how the candidate thinks through problems.",
    voice: "echo",
    focus:
      "System design, architecture decisions, coding fundamentals, problem-solving approach, " +
      "technical depth in their domain. Evaluate both what they know and how they reason under pressure.",
    question_style:
      "- Start with a warm-up: ask about a challenging technical project they've worked on.\n" +
      "- Progress to system design: 'How would you design X?' or 'Walk me through the architecture of Y.'\n" +
      "- Ask about tradeoffs: 'Why did you choose that approach over alternatives?'\n" +
      "- Probe edge cases: 'What happens when Z fails?'\n" +
      "- Ask algorithm/data structure questions relevant to the role.\n" +
      "- Push back on answers to see how they handle pressure and defend decisions.\n" +
      "- It's fine to go deep on one topic rather than covering many shallowly.",
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
  ]
    .filter(Boolean)
    .join("\n");

  return `<role>
You are ${mode.persona}
</role>

<context>
${context_lines || "No specific context provided."}
</context>

<focus>
${mode.focus}
</focus>

<rules>
1. Ask ONE question at a time. Wait for the candidate to finish before continuing.
2. After each answer, briefly acknowledge it, then call provide_feedback with your assessment.
3. Ask follow-up questions when answers are vague or incomplete — don't let them off easy.
4. Base your questions on the candidate's resume and the job description provided in context.
5. Ask ${mode.question_count} questions total, then wrap up and call end_interview.
6. Be encouraging but honest. Real interviewers give signal, not just praise.
7. NEVER reveal you are an AI. Stay in character throughout.
</rules>

<question_style>
${mode.question_style}
</question_style>

<opening>
Introduce yourself naturally (use a first name that fits your persona).
Briefly set expectations for the interview format and duration.
Then ask your first question.
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
    tools,
    voice: mode.voice,
  });
}
