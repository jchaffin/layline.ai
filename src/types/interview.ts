export type InterviewMode = "recruiter" | "technical" | "final_round";

export interface InterviewContext {
  mode: InterviewMode;
  companyName?: string;
  roleTitle?: string;
  jobDescription?: string;
}

export interface MeAgentContext {
  mode: InterviewMode;
  companyName?: string;
  roleTitle?: string;
  jobDescription?: string;
  resumeSummary?: string;
}

export interface InterviewSetupData {
  mode: InterviewMode;
  companyName?: string;
  roleTitle?: string;
  jobDescription?: string;
  resumeSummary?: string;
}

export interface FeedbackItem {
  rating: string;
  strengths: string;
  improvements: string;
  tip: string;
  timestamp: number;
}

export interface CoachSuggestion {
  talking_points: string;
  example_opener: string;
  framework: string;
  timestamp: number;
}

export interface CoachWarning {
  warning: string;
  timestamp: number;
}

export type NavigationStep =
  | "dashboard"
  | "documents"
  | "jobs"
  | "job-board"
  | "insights"
  | "prep"
  | "interview"
  | "live-interview"
  | "mock-interview"
  | "other";
