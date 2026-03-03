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

export interface JobAnalysis {
  companyInfo?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  qualifications?: string[];
  responsibilities?: string[];
  experience?: string;
  experienceLevel?: string;
  workType?: string;
  location?: string;
}

export interface InterviewSetupData {
  mode: InterviewMode;
  companyName?: string;
  roleTitle?: string;
  jobDescription?: string;
  resumeSummary?: string;
  analysis?: JobAnalysis;
}

export interface FeedbackItem {
  rating: string;
  strengths: string;
  improvements: string;
  tip: string;
  timestamp: number;
}

export interface CoachSuggestion {
  response: string;
  timestamp: number;
  streaming?: boolean;
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
