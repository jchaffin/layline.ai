import { z } from "zod";

// ============ Parsed resume / job analysis types (for UI and API) ============

export interface ParsedResumeExperience {
  company: string;
  role: string;
  duration: string;
  startDate?: Date;
  endDate?: Date;
  isCurrentRole?: boolean;
  location?: string;
  description?: string;
  achievements: string[];
  responsibilities: string[];
  keywords: string[];
}

export interface ParsedResumeEducation {
  institution: string;
  degree: string;
  field?: string;
  year: string;
  gpa?: string;
  honors?: string;
}

export interface ParsedResumeContact {
  email?: string;
  phone?: string;
  name?: string;
  title?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface ParsedResume {
  summary: string;
  skills: string[];
  experience: ParsedResumeExperience[];
  projects?: ParsedResumeExperience[];
  education: ParsedResumeEducation[];
  contact: ParsedResumeContact;
  ats_score: string;
  ats_recommendations: string[];
  tailoring_notes?: {
    keyChanges?: string[];
    keywordsAdded?: string[];
    focusAreas?: string[];
  };
}

export interface JobAnalysis {
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  qualifications: string[];
  experience: string;
  company: string;
  role: string;
  sentiment: number;
  experienceLevel: string;
  requiredYears: number;
  location: string;
  workType: string;
  companyInfo: string;
  keywords: string[];
  strongPoints?: string[];
  missingSkills?: string[];
}

// ============ Job application (tracker + API) ============

export const insertJobApplicationSchema = z.object({
  userId: z.string().optional(),
  jobTitle: z.string().min(1),
  company: z.string().min(1),
  jobUrl: z.string().url(),
  status: z.enum(["applied", "in-progress", "rejected", "offered"]).default("applied"),
  notes: z.string().optional(),
  location: z.string().optional(),
  salaryRange: z.string().optional(),
});

export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;

export interface JobApplication {
  id: string;
  userId?: string;
  jobTitle: string;
  company: string;
  jobUrl: string;
  status: "applied" | "in-progress" | "rejected" | "offered";
  appliedDate: Date;
  lastUpdated: Date;
  notes?: string;
  location?: string;
  salaryRange?: string;
  createdAt: Date;
}

// ============ WebSocket message types ============

export const websocketMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("audio_chunk"),
    data: z.string(),
  }),
  z.object({
    type: z.literal("start_recording"),
  }),
  z.object({
    type: z.literal("stop_recording"),
  }),
  z.object({
    type: z.literal("set_interview_context"),
    data: z.object({
      companyName: z.string().optional(),
      roleTitle: z.string().optional(),
      interviewType: z.string().optional(),
      jobDescription: z.string().optional(),
      skillFocus: z.array(z.string()).optional(),
      customInstructions: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal("transcription"),
    data: z.object({
      text: z.string(),
      timestamp: z.number(),
      speaker: z.enum(["interviewer", "user"]),
    }),
  }),
  z.object({
    type: z.literal("suggestion"),
    data: z.object({
      text: z.string(),
      keyPoints: z.array(z.string()),
      estimatedDuration: z.string(),
      confidence: z.number(),
    }),
  }),
  z.object({
    type: z.literal("error"),
    message: z.string(),
  }),
]);

export type WebSocketMessage = z.infer<typeof websocketMessageSchema>;
