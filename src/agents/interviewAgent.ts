import { createAgent, defineTool, type ToolDefinition } from "@jchaffin/voicekit";
import type { InterviewMode, InterviewContext } from "@/types/interview";
import { search_interview_materials } from "./tools";

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

const baseTools = [
  end_interview,
  provide_feedback,
  search_interview_materials,
] as ToolDefinition[];
const technicalTools = [
  end_interview,
  provide_feedback,
  search_interview_materials,
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
      "- For high-level technical questions: call search_interview_materials first, then ask a question grounded in the KB (e.g. concepts, tradeoffs). No whiteboard.\n" +
      "- Probe for culture fit and team collaboration.\n" +
      "- Ask about salary expectations or timeline if appropriate.\n" +
      "- Keep it conversational — this is a screen, not a grilling.",
    question_count: "5-7",
  },

  technical: {
    name: "TechnicalInterviewer",
    persona:
      "a senior engineer who guides candidates through real technical problems while they learn. " +
      "You are both interviewer and teacher: you ask substantive questions grounded in real concepts, and when they struggle you scaffold—hint, clarify, or explain—so they learn as they go. " +
      "Your goal is to help them think through the problem, not to stump them.",
    voice: "echo",
    focus:
      "Real technical depth: algorithms, data structures, system design, tradeoffs—all grounded in the KB. " +
      "Guide the learning process: when they're stuck, offer a hint or reframe the question; when they're on track, probe deeper. " +
      "Use provide_feedback to reinforce what they got right and gently correct or teach what they missed.",
    question_style:
      "- Start with a warm-up: ask about a challenging technical project they've worked on.\n" +
      "- For coding: call search_interview_materials first (e.g. query the algorithm or pattern), then call present_coding_problem. " +
      "Ask real questions from the KB—concepts, tradeoffs, edge cases. When they're stuck, guide them: 'What if we tried X?' or 'Think about the time complexity of that approach.'\n" +
      "- For system design: call search_interview_materials with a query like 'rate limiter design' or 'distributed cache' BEFORE asking. " +
      "Use the KB to ask specific, real questions. If they miss a key tradeoff, teach it: 'One thing to consider is...' then ask them to build on that.\n" +
      "- GUIDE THE LEARNING: Don't just evaluate. When they're wrong or stuck, give a hint, a nudge, or a mini-explanation so they can recover and learn. Then ask a follow-up to reinforce.\n" +
      "- Use review_code to see their code. Discuss it—point out what works, suggest improvements, explain why a different approach might be better.\n" +
      "- Go deep on fewer problems. Your job is to help them learn the material, not to rush through a checklist.",
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
3. After each answer, briefly acknowledge it, then call provide_feedback with your assessment. In technical mode, make feedback educational—reinforce what they got right, and when they missed something, briefly teach it before moving on.
4. Ask follow-up questions when answers are vague or incomplete — don't let them off easy.
5. Base your questions on the candidate's resume and the job description provided in context.
6. Ask ${mode.question_count} questions total, then wrap up and call end_interview.
7. Be encouraging but honest. Real interviewers give signal, not just praise.
8. NEVER reveal you are an AI. Stay in character throughout.
9. Be conversational and natural. Real interviewers don't give speeches — they ask questions and listen.
10. GROUND technical questions in the KB: Before asking algorithms, coding, or system-design questions, you MUST call search_interview_materials with a query that matches the topic. Use the returned overview and source chunks to shape your question — reference concepts, patterns, or tradeoffs from the KB. Do not ask generic questions; ground them in the retrieved material.
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
