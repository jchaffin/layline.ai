import { createAgent, defineTool, type ToolDefinition } from "@jchaffin/voicekit";

const endInterviewTool = defineTool({
  name: "end_interview",
  description:
    "End the interview session. Call this when the interview is complete, the candidate asks to stop, or all planned questions have been asked.",
  parameters: {
    reason: {
      type: "string",
      description: "Reason for ending (completed, candidate_request, time_up)",
    },
  },
  required: ["reason"],
  execute: ({ reason }) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("interview:end", { detail: { reason } })
      );
    }
    return { success: true, reason };
  },
});

const provideFeedbackTool = defineTool({
  name: "provide_feedback",
  description:
    "Provide structured feedback on the candidate's answer. Use after the candidate finishes responding to give them actionable coaching.",
  parameters: {
    rating: {
      type: "string",
      description: "Rating: strong, adequate, needs_improvement",
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

function buildInstructions(context: {
  companyName?: string;
  roleTitle?: string;
  interviewType?: string;
  jobDescription?: string;
}) {
  const { companyName, roleTitle, interviewType, jobDescription } = context;

  const contextSection = [
    companyName && `Company: ${companyName}`,
    roleTitle && `Role: ${roleTitle}`,
    interviewType && `Interview Type: ${interviewType}`,
    jobDescription && `Job Description:\n${jobDescription}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `<role>
You are a professional AI interviewer conducting a mock ${interviewType || "general"} interview.
You ask questions, listen to the candidate's answers, and provide coaching feedback to help them improve.
</role>

<context>
${contextSection || "No specific context provided. Conduct a general interview."}
</context>

<rules>
1. Ask ONE question at a time. Wait for the candidate to respond before continuing.
2. Start with an introduction and a warm-up question, then progress to harder questions.
3. Tailor questions to the role, company, and interview type when provided.
4. After the candidate answers, briefly acknowledge their response and provide coaching using the provide_feedback tool.
5. Ask follow-up questions when the candidate's answer is vague or incomplete.
6. Keep track of how many questions you've asked. After 6-8 questions, wrap up the interview.
7. Be encouraging but honest. Point out both strengths and areas for improvement.
8. When wrapping up, call the end_interview tool.
</rules>

<style>
- Speak naturally and conversationally, like a real interviewer would.
- Keep questions concise and clear.
- Use a professional but friendly tone.
- For technical interviews, ask about real-world scenarios and system design.
- For behavioral interviews, use the STAR method framework.
</style>

<opening>
Greet the candidate warmly, introduce yourself, and briefly describe how the interview will go.
Then ask your first question.
</opening>`;
}

export function createInterviewAgent(context: {
  companyName?: string;
  roleTitle?: string;
  interviewType?: string;
  jobDescription?: string;
}) {
  return createAgent({
    name: "InterviewCoach",
    instructions: buildInstructions(context),
    tools: [endInterviewTool, provideFeedbackTool] as ToolDefinition[],
    voice: "alloy",
  });
}
