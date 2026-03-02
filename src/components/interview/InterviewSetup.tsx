"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import {
  Play,
  Building,
  User,
  Phone,
  Code,
  Crown,
  FileText,
  Link,
  Loader2,
  Check,
  X,
} from "lucide-react";
import type { InterviewMode } from "@/types/interview";

interface InterviewSetupProps {
  onStart: (setupData: {
    mode: InterviewMode;
    companyName?: string;
    roleTitle?: string;
    jobDescription?: string;
  }) => void;
}

interface SavedJobAnalysis {
  description: string;
  analysis: {
    company?: string;
    role?: string;
    requiredSkills?: string[];
    preferredSkills?: string[];
    responsibilities?: string[];
    experienceLevel?: string;
    location?: string;
    workType?: string;
  };
}

type JDSource = "none" | "saved" | "paste" | "url";

const MODE_OPTIONS: {
  value: InterviewMode;
  label: string;
  persona: string;
  description: string;
  icon: typeof Phone;
}[] = [
  {
    value: "recruiter",
    label: "Recruiter Screen",
    persona: "Recruiter / Talent Acquisition",
    description:
      "Initial phone screen focused on background, motivation, and culture fit. High-level technical questions to verify competence.",
    icon: Phone,
  },
  {
    value: "technical",
    label: "Technical Interview",
    persona: "VP of Engineering / Senior Engineer",
    description:
      "In-depth technical interview with system design, architecture, coding fundamentals, and problem-solving under pressure.",
    icon: Code,
  },
  {
    value: "final_round",
    label: "Final Round",
    persona: "CEO / CTO",
    description:
      "Executive-level interview focused on leadership, strategic thinking, vision alignment, and long-term impact.",
    icon: Crown,
  },
];

export default function InterviewSetup({ onStart }: InterviewSetupProps) {
  const [mode, setMode] = useState<InterviewMode | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const [jdSource, setJdSource] = useState<JDSource>("none");
  const [savedJob, setSavedJob] = useState<SavedJobAnalysis | null>(null);
  const [jobUrl, setJobUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("currentJobAnalysis");
      if (stored) {
        const parsed = JSON.parse(stored) as SavedJobAnalysis;
        setSavedJob(parsed);
      }
    } catch {}
  }, []);

  const applySavedJob = () => {
    if (!savedJob) return;
    setJdSource("saved");
    setJobDescription(savedJob.description);
    if (savedJob.analysis.company) setCompanyName(savedJob.analysis.company);
    if (savedJob.analysis.role) setRoleTitle(savedJob.analysis.role);
  };

  const analyzeFromUrl = async () => {
    if (!jobUrl.trim()) return;
    setIsAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await fetch("/api/jobs/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobUrl.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const { description, analysis } = await res.json();
      setJobDescription(description);
      if (analysis.company) setCompanyName(analysis.company);
      if (analysis.role) setRoleTitle(analysis.role);
      setJdSource("url");
      localStorage.setItem(
        "currentJobAnalysis",
        JSON.stringify({ description, analysis })
      );
    } catch (err) {
      setAnalyzeError(
        err instanceof Error ? err.message : "Failed to analyze URL"
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeFromPaste = async () => {
    if (!jobDescription.trim()) return;
    setIsAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await fetch("/api/jobs/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: jobDescription.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const { description, analysis } = await res.json();
      if (analysis.company && !companyName) setCompanyName(analysis.company);
      if (analysis.role && !roleTitle) setRoleTitle(analysis.role);
      localStorage.setItem(
        "currentJobAnalysis",
        JSON.stringify({ description, analysis })
      );
    } catch (err) {
      setAnalyzeError(
        err instanceof Error ? err.message : "Failed to analyze"
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearJd = () => {
    setJdSource("none");
    setJobDescription("");
    setJobUrl("");
    setAnalyzeError(null);
  };

  const handleStart = () => {
    if (!mode) return;
    onStart({ mode, companyName, roleTitle, jobDescription });
  };

  const jdLoaded = jdSource !== "none" && jobDescription.trim().length > 0;

  return (
    <div className="space-y-8">
      {/* Mode selection */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Choose Interview Stage</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MODE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const selected = mode === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setMode(opt.value)}
                className={`text-left p-5 rounded-xl border-2 transition-all ${
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium">{opt.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {opt.persona}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Details form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Job Description source */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Job Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {jdLoaded ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Check className="w-4 h-4" />
                      <span>
                        JD loaded
                        {jdSource === "saved"
                          ? " from previous analysis"
                          : jdSource === "url"
                            ? " from URL"
                            : ""}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearJd}
                      className="text-muted-foreground"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {jobDescription.slice(0, 300)}...
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedJob && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={applySavedJob}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Use saved JD
                      {savedJob.analysis.company &&
                        ` — ${savedJob.analysis.company}`}
                      {savedJob.analysis.role &&
                        `, ${savedJob.analysis.role}`}
                    </Button>
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm">From URL</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="https://linkedin.com/jobs/..."
                          value={jobUrl}
                          onChange={(e) => setJobUrl(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && analyzeFromUrl()
                          }
                          className="pl-10"
                        />
                      </div>
                      <Button
                        onClick={analyzeFromUrl}
                        disabled={!jobUrl.trim() || isAnalyzing}
                        size="sm"
                      >
                        {isAnalyzing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Fetch"
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-card px-2 text-muted-foreground">
                        or paste
                      </span>
                    </div>
                  </div>

                  <Textarea
                    placeholder="Paste the full job description here..."
                    value={jobDescription}
                    onChange={(e) => {
                      setJobDescription(e.target.value);
                      if (e.target.value.trim()) setJdSource("paste");
                      else setJdSource("none");
                    }}
                    rows={5}
                    className="resize-none text-sm"
                  />

                  {jdSource === "paste" && jobDescription.trim() && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={analyzeFromPaste}
                      disabled={isAnalyzing}
                      className="w-full"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        "Analyze & auto-fill company/role"
                      )}
                    </Button>
                  )}

                  {analyzeError && (
                    <p className="text-xs text-destructive">{analyzeError}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Company / Role overrides */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Interview Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="companyName"
                    placeholder="e.g., Google, Stripe, a Series B startup"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roleTitle">Role</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="roleTitle"
                    placeholder="e.g., Senior Software Engineer, Product Manager"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button
                onClick={handleStart}
                disabled={!mode}
                className="w-full"
                size="lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Interview
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Step n={1} title="AI Interviewer">
              A voice-powered AI conducts a realistic interview matched to the
              stage you selected. Each mode has a distinct persona and question
              style.
            </Step>
            <Step n={2} title="Live Transcript">
              Everything is transcribed in real-time so you can focus on the
              conversation.
            </Step>
            <Step n={3} title="AI Coach">
              Your personal coach analyzes each question and suggests talking
              points, frameworks, and openers — visible only to you.
            </Step>
            <Step n={4} title="Review & Improve">
              After the interview, review your transcript, per-question
              feedback, and overall score.
            </Step>

            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h5 className="font-medium mb-2 text-sm">Tips</h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Use a quiet environment with a good mic</li>
                <li>Speak clearly at a normal pace</li>
                <li>Add a job description for tailored questions</li>
                <li>Treat it like a real interview</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium shrink-0">
        {n}
      </div>
      <div>
        <h4 className="font-medium text-sm">{title}</h4>
        <p className="text-sm text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}
