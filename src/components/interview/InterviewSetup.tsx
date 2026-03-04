"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import {
  Play,
  Briefcase,
  Building,
  MapPin,
  Calendar,
  User,
  Phone,
  Code,
  Crown,
  Loader2,
  Check,
  X,
  Search,
} from "lucide-react";
import type { InterviewMode, InterviewSetupData } from "@/types/interview";
interface InterviewSetupProps {
  onStart: (setupData: InterviewSetupData) => void;
}

type JDSource = "none" | "saved" | "paste";
interface TrackerApplication {
  id: string;
  status: "applied" | "interview" | "rejected" | "offer" | "accepted";
  jobTitle: string;
  company: string;
  location?: string;
  appliedDate?: string;
  description?: string;
  analysis?: any;
}

interface ParsedResumePreview {
  name?: string;
  summary?: string;
  skills?: string[];
  experience?: { company?: string; role?: string; description?: string }[];
  education?: { school?: string; degree?: string; field?: string }[];
}

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
  const [mode, setMode] = useState<InterviewMode | null>("recruiter");
  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const [jdSource, setJdSource] = useState<JDSource>("none");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [trackerApps, setTrackerApps] = useState<TrackerApplication[]>([]);
  const [selectedTrackerAppId, setSelectedTrackerAppId] = useState<string>("");
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);

  const [researchPhase, setResearchPhase] = useState<"idle" | "loading" | "done">("idle");
  const [companyResearch, setCompanyResearch] = useState<string | null>(null);

  const [resumeOptions, setResumeOptions] = useState<{ key: string; name: string; type: string }[]>([]);
  const [selectedResumeKey, setSelectedResumeKey] = useState<string>("");
  const [selectedResumeSummary, setSelectedResumeSummary] = useState<string | null>(null);
  const [selectedResumeData, setSelectedResumeData] = useState<ParsedResumePreview | null>(null);
  const [resumeListLoading, setResumeListLoading] = useState(true);

  useEffect(() => {
    fetch("/api/resume/versions")
      .then((r) => r.json())
      .then((data) => {
        const groups = data.groups || [];
        const files: { key: string; name: string; type: string }[] = [];
        for (const g of groups) {
          for (const v of g.versions || []) {
            files.push({
              key: v.key,
              name: v.type === "original" ? (g.originalName || v.label) : (v.label || "Tailored"),
              type: v.type || "original",
            });
          }
        }
        files.sort((a, b) => a.name.localeCompare(b.name));
        setResumeOptions(files);
      })
      .catch(() => {})
      .finally(() => setResumeListLoading(false));
  }, []);

  const selectResume = async (key: string) => {
    setSelectedResumeKey(key);
    setSelectedResumeSummary(null);
    setSelectedResumeData(null);
    const isTailored = key.includes("tailored-resumes/");
    try {
      let raw: any = null;
      if (isTailored) {
        const res = await fetch(`/api/resume/parsed?action=get&key=${encodeURIComponent(key)}`);
        if (res.ok) {
          const json = await res.json();
          raw = json.tailoredResume || json;
        }
      } else {
        const parsedKey = key.replace("original-resumes/", "parsed-resumes/").replace(/\.[^.]+$/, "-parsed.json");
        const res = await fetch(`/api/resume/parsed?action=get&key=${encodeURIComponent(parsedKey)}`);
        if (res.ok) raw = await res.json();
      }
      if (!raw || typeof raw !== "object") return;

      const name = raw.name ?? raw.contact?.name;
      const preview: ParsedResumePreview = {
        name,
        summary: raw.summary,
        skills: Array.isArray(raw.skills) ? raw.skills : [],
        experience: Array.isArray(raw.experience)
          ? raw.experience.map((e: any) => ({ company: e.company, role: e.role, description: e.description }))
          : [],
        education: Array.isArray(raw.education)
          ? raw.education.map((e: any) => ({ school: e.school ?? e.institution, degree: e.degree, field: e.field }))
          : [],
      };
      setSelectedResumeData(preview);

      const parts: string[] = [];
      if (name) parts.push(`Name: ${name}`);
      if (raw.summary) parts.push(`Summary: ${raw.summary}`);
      if (raw.experience?.length) {
        const exp = raw.experience.slice(0, 3).map((e: any) =>
          `${e.role || ""} at ${e.company || ""}: ${(e.description || "").slice(0, 200)}`
        ).join("\n");
        parts.push(`Recent Experience:\n${exp}`);
      }
      if (raw.skills?.length) parts.push(`Skills: ${raw.skills.slice(0, 20).join(", ")}`);
      setSelectedResumeSummary(parts.join("\n\n"));
    } catch {
      setSelectedResumeSummary(null);
      setSelectedResumeData(null);
    }
  };

  useEffect(() => {
    fetch("/api/jobs/applications")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.applications)) {
          setTrackerApps(d.applications.map((a: any) => ({
            id: a.id,
            status: a.status,
            jobTitle: a.jobTitle,
            company: a.company,
            location: a.location,
            appliedDate: a.appliedDate || a.createdAt,
            description: a.description,
            analysis: a.analysis,
          })));
        }
      })
      .catch(() => {});
  }, []);

  const applyTrackerApp = (app: TrackerApplication) => {
    setCompanyName(app.company);
    setRoleTitle(app.jobTitle);
    setSelectedTrackerAppId(app.id);
    setSelectedAnalysis(app.analysis || null);
    const parts = [
      app.analysis?.companyInfo && `About: ${app.analysis.companyInfo}`,
      app.analysis?.requiredSkills?.length && `Required Skills: ${app.analysis.requiredSkills.join(", ")}`,
      app.analysis?.qualifications?.length && `Qualifications:\n${app.analysis.qualifications.join("\n")}`,
      app.analysis?.responsibilities?.length && `Responsibilities:\n${app.analysis.responsibilities.join("\n")}`,
      app.description && `Job Description:\n${app.description}`,
    ].filter(Boolean).join("\n\n");

    setJobDescription(parts);
    setJdSource(parts.trim() ? "saved" : "none");
  };

  useEffect(() => {
    try {
      const ctx = localStorage.getItem("interviewContext");
      if (ctx) {
        const parsed = JSON.parse(ctx);
        if (parsed.companyName) setCompanyName(parsed.companyName);
        if (parsed.roleTitle) setRoleTitle(parsed.roleTitle);
        if (parsed.jobDescription) setJobDescription(parsed.jobDescription);
        if (parsed.jobDescription) setJdSource("saved");
        localStorage.removeItem("interviewContext");
      }
    } catch {}
  }, []);

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
    setAnalyzeError(null);
  };

  const handleStart = async () => {
    if (!mode) return;
    setResearchPhase("loading");
    setCompanyResearch(null);

    let research: string | null = null;
    if (companyName || roleTitle) {
      try {
        const res = await fetch("/api/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company: companyName, role: roleTitle, jobDescription }),
        });
        if (res.ok) {
          const data = await res.json();
          research = data.research || null;
        }
      } catch {}
    }

    setCompanyResearch(research);
    setResearchPhase("done");

    onStart({
      mode,
      companyName,
      roleTitle,
      jobDescription,
      analysis: selectedAnalysis || undefined,
      ...(selectedResumeSummary && { resumeSummary: selectedResumeSummary }),
      ...(research && { companyResearch: research }),
    });
  };

  const getStatusColor = (status: TrackerApplication["status"]) => {
    switch (status) {
      case "applied": return "bg-blue-100 text-blue-800";
      case "interview": return "bg-yellow-100 text-yellow-800";
      case "offer": return "bg-green-100 text-green-800";
      case "accepted": return "bg-emerald-100 text-emerald-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (researchPhase !== "idle") {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          {researchPhase === "loading" ? (
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          ) : (
            <Check className="w-8 h-8 text-primary" />
          )}
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">
            {researchPhase === "loading" ? "Researching company…" : "Research complete"}
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            {researchPhase === "loading"
              ? `Gathering context on ${companyName || "the company"}${roleTitle ? ` for the ${roleTitle} role` : ""}`
              : "Starting your interview session…"}
          </p>
        </div>
        {researchPhase === "done" && companyResearch && (
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="w-4 h-4" />
                Company Research
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {companyResearch}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

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
              <div className="space-y-3">
                {trackerApps.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">From Application Tracker</Label>
                    <div className="max-h-64 overflow-y-auto space-y-2 rounded-md border p-2">
                      {trackerApps
                        .filter((a) => a.status !== "rejected" && a.status !== "accepted")
                        .map((app) => {
                          const selected = selectedTrackerAppId === app.id;
                          return (
                            <button
                              key={app.id}
                              type="button"
                              onClick={() => applyTrackerApp(app)}
                              className={`w-full text-left rounded-lg border p-3 transition-colors ${
                                selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{app.jobTitle}</p>
                                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                    <span className="inline-flex items-center gap-1">
                                      <Building className="w-3.5 h-3.5" />
                                      {app.company}
                                    </span>
                                    {app.location && (
                                      <span className="inline-flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {app.location}
                                      </span>
                                    )}
                                    {app.appliedDate && (
                                      <span className="inline-flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(app.appliedDate).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Badge className={getStatusColor(app.status)}>
                                  <Briefcase className="w-3.5 h-3.5 mr-1" />
                                  <span className="capitalize">{app.status}</span>
                                </Badge>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {selectedAnalysis ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Context sent to interviewer and coach:</p>
                      <Button variant="ghost" size="sm" onClick={() => { clearJd(); setSelectedAnalysis(null); }} className="text-muted-foreground">
                        <X className="w-4 h-4 mr-1" /> Clear
                      </Button>
                    </div>

                    {selectedAnalysis.companyInfo && (
                      <div className="text-sm">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">About</span>
                        <p className="mt-1 text-muted-foreground">{selectedAnalysis.companyInfo}</p>
                      </div>
                    )}

                    {selectedAnalysis.requiredSkills?.length > 0 && (
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Required Skills</span>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {selectedAnalysis.requiredSkills.map((s: string, i: number) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-foreground/10 font-medium">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedAnalysis.preferredSkills?.length > 0 && (
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preferred Skills</span>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {selectedAnalysis.preferredSkills.map((s: string, i: number) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedAnalysis.qualifications?.length > 0 && (
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Qualifications</span>
                        <ul className="mt-1 space-y-1">
                          {selectedAnalysis.qualifications.map((q: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-[7px] shrink-0" />
                              {q}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedAnalysis.responsibilities?.length > 0 && (
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Responsibilities</span>
                        <ul className="mt-1 space-y-1">
                          {selectedAnalysis.responsibilities.map((r: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-[7px] shrink-0" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedAnalysis.experienceLevel && (
                      <div className="text-xs">
                        <span className="font-medium">Level:</span> {selectedAnalysis.experienceLevel}
                        {selectedAnalysis.experience && ` · ${selectedAnalysis.experience}`}
                      </div>
                    )}

                    {selectedAnalysis.workType && (
                      <div className="text-xs">
                        <span className="font-medium">Work Type:</span> {selectedAnalysis.workType}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Or paste a job description:
                      </p>
                      {jobDescription.trim() && (
                        <Button variant="ghost" size="sm" onClick={clearJd} className="text-muted-foreground">
                          <X className="w-4 h-4 mr-1" /> Clear
                        </Button>
                      )}
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
                  </>
                )}
              </div>
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

        <div className="space-y-4">
          {/* Resume selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Resume to use
              </CardTitle>
              <CardDescription className="text-sm">
                Choose which resume the interviewer and coach will reference.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resumeListLoading ? (
                <p className="text-sm text-muted-foreground">Loading resumes…</p>
              ) : resumeOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No resumes in your account yet. Upload one on the Dashboard.
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2 rounded-md border p-2">
                  {resumeOptions.map((opt) => {
                    const selected = selectedResumeKey === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => selectResume(opt.key)}
                        className={`w-full text-left rounded-lg border p-3 transition-colors ${
                          selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">{opt.name}</p>
                          {opt.type === "tailored" && (
                            <Badge variant="secondary" className="shrink-0 text-xs">Tailored</Badge>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Parsed resume preview */}
          {selectedResumeData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedResumeData.name || "Selected Resume"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedResumeData.summary && (
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Summary</span>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedResumeData.summary}</p>
                  </div>
                )}

                {selectedResumeData.skills && selectedResumeData.skills.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Skills</span>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {selectedResumeData.skills.slice(0, 25).map((s, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-foreground/10 font-medium">{s}</span>
                      ))}
                      {selectedResumeData.skills.length > 25 && (
                        <span className="text-xs px-2 py-0.5 text-muted-foreground">+{selectedResumeData.skills.length - 25} more</span>
                      )}
                    </div>
                  </div>
                )}

                {selectedResumeData.experience && selectedResumeData.experience.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Experience</span>
                    <div className="mt-2 space-y-3">
                      {selectedResumeData.experience.slice(0, 4).map((exp, i) => (
                        <div key={i} className="border-l-2 border-primary/20 pl-3">
                          <div className="text-sm font-medium">{exp.role}</div>
                          <div className="text-xs text-muted-foreground">{exp.company}</div>
                          {exp.description && (
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedResumeData.education && selectedResumeData.education.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Education</span>
                    <div className="mt-1.5 space-y-1">
                      {selectedResumeData.education.map((edu, i) => (
                        <div key={i} className="text-sm">
                          <span className="font-medium">{edu.degree}{edu.field && `, ${edu.field}`}</span>
                          {edu.school && <span className="text-muted-foreground"> — {edu.school}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
