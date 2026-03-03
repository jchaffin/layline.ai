export interface Job {
  id: string;
  title: string;
  company: string;
  employer_logo?: string | null;
  location: string;
  description: string;
  url?: string;
  job_apply_link?: string | null;
  posted: string;
  job_posted_at_datetime_utc?: string | null;
  salary?: string | null;
  job_min_salary?: number | null;
  job_max_salary?: number | null;
  job_salary_period?: string | null;
  type: string;
  job_is_remote?: boolean;
  job_highlights?: {
    Qualifications?: string[];
    Responsibilities?: string[];
    Benefits?: string[];
  } | null;
  source?: string;
  tags?: string[];
  fitScore?: number;
  matchScore?: number;
  matchReasons?: string[];
  matchedSkills?: string[];
  missingSkills?: string[];
  analysis?: {
    companyInfo?: string;
    experience?: string;
    experienceLevel?: string;
    requiredSkills?: string[];
    preferredSkills?: string[];
    responsibilities?: string[];
    qualifications?: string[];
    workType?: string;
  };
}

export interface JobAnalysis {
  company: string;
  role: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  qualifications: string[];
  experienceLevel: string;
  requiredYears: number;
  location: string;
  workType: string;
  companyInfo: string;
  keywords: string[];
  sentiment: number;
  experience: string;
  strongPoints?: string[];
  missingSkills?: string[];
}

export interface Application {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  status: "applied" | "interview" | "rejected" | "offer" | "accepted";
  appliedDate: Date;
  jobUrl?: string;
  notes?: string;
  salary?: string;
  description?: string;
  analysis?: any;
}


export interface InterviewStep {
  step: number;
  name: string;
  duration?: string;
  completed?: boolean;
}



export interface Analysis {
  company?: string;
  role?: string;
  companyInfo?: string;
  experience?: string;
  experienceLevel?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  responsibilities?: string[];
  qualifications?: string[];
  workType?: string;
  location?: string;
  keywords?: string[];
  interviewProcess?: InterviewStep[];
}