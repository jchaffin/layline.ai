"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Navigation, type NavigationStep } from "@/components/layout/Navigation";
import ResumeMatchAnalysis from "@/components/resume/ResumeMatchAnalysis";
import DocumentManager from "@/components/documents/DocumentManager";
import DocumentEditView from "@/components/documents/DocumentEditView";
import JobAnalysis from "@/components/jobs/JobAnalysis";
import JobManager from "@/components/jobs/JobManager";
import { useAuthenticatedStorage } from "@/hooks/useAuthStorage";
import {
  FileText,
  Briefcase,
  Mic,
  ChevronLeft,
  CheckCircle,
  Circle,
  LogOut,
} from "lucide-react";
import type {
  ParsedResume,
  JobAnalysis as JobAnalysisType,
} from "@/lib/schema";

export default function DashboardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<NavigationStep>("dashboard");
  const [resumeData, setResumeData] = useState<ParsedResume | null>(null);
  const [jobData, setJobData] = useState<JobAnalysisType | null>(null);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [currentJobDescription, setCurrentJobDescription] = useState<string | null>(null);
  const [documentsView, setDocumentsView] = useState<"grid" | "upload" | "edit">("grid");
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [sidebarVisibleInEditor, setSidebarVisibleInEditor] = useState(false);

  const storage = useAuthenticatedStorage();

  useEffect(() => {
    if (storage.isAuthenticated) {
      const cached = storage.getItem("parsedResumeData");
      if (cached && !resumeData) setResumeData(cached);
    }
  }, [storage.isAuthenticated, resumeData]);

  const handleResumeUploaded = (data: ParsedResume | null) => {
    if (!data) {
      setResumeData(null);
      storage.removeItem("parsedResumeData");
      localStorage.removeItem("parsedResumeData");
      return;
    }
    setResumeData(data);
    storage.setItem("parsedResumeData", data);
  };

  const handleJobAnalyzed = ({
    description,
    analysis,
  }: {
    description: string;
    analysis: JobAnalysisType;
  }) => {
    setJobData(analysis);
    setCurrentJobDescription(description);
    storage.setItem("currentJobAnalysis", { description, analysis });
  };

  const renderStep = () => {
    switch (currentStep) {
      case "dashboard":
        return <HomeView resumeData={resumeData} onNavigate={setCurrentStep} />;

      case "documents":
        if (documentsView === "edit" && selectedDocument) {
          return (
            <DocumentEditView
              document={selectedDocument}
              onBack={() => { setDocumentsView("grid"); setSelectedDocument(null); setIsNavCollapsed(false); setSidebarVisibleInEditor(false); }}
              onSave={(data: any) => {
                if (data) {
                  storage.setItem("parsedResumeData", data);
                  selectedDocument.data = data;
                }
              }}
              onToggleSidebar={() => {
                const next = !sidebarVisibleInEditor;
                setSidebarVisibleInEditor(next);
                if (next) setIsNavCollapsed(false);
              }}
              sidebarVisible={sidebarVisibleInEditor}
            />
          );
        }
        return (
          <Section title="Documents">
            <DocumentManager
              currentResume={resumeData}
              onNavigateToEdit={(doc: any) => {
                setSelectedDocument(doc);
                setDocumentsView("edit");
                setIsNavCollapsed(true);
              }}
              onDocumentDeleted={() => handleResumeUploaded(null)}
              onFileUploaded={handleResumeUploaded}
            />
          </Section>
        );

      case "jobs":
      case "job-board":
        return (
          <Section title="Jobs">
            <JobManager resumeData={resumeData} />
          </Section>
        );

      case "insights":
        return (
          <Section title="Job Analysis">
            <div className="space-y-6">
              <JobAnalysis onJobAnalyzed={handleJobAnalyzed} />
              {resumeData && jobData && (
                <ResumeMatchAnalysis
                  resumeData={resumeData}
                  jobDescription={currentJobDescription || undefined}
                  companyName={jobData?.company}
                  roleTitle={jobData?.role}
                />
              )}
            </div>
          </Section>
        );

      case "interview":
      case "live-interview":
      case "mock-interview":
        return (
          <Section title="Interview Practice">
            <Card>
              <CardContent className="p-8 text-center space-y-4">
                <Mic className="w-10 h-10 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">
                  Voice-powered interview practice with AI interviewers
                </p>
                <Button asChild>
                  <a href="/interview">Go to Interview</a>
                </Button>
              </CardContent>
            </Card>
          </Section>
        );

      default:
        return null;
    }
  };

  const isEditingDocument = documentsView === "edit" && !!selectedDocument;
  const sidebarVisible = !isEditingDocument || sidebarVisibleInEditor;

  return (
    <div className="min-h-screen bg-background">
      {sidebarVisible && (
        <Navigation
          currentStep={currentStep}
          onStepChange={(step) => {
            if (step === "interview") {
              window.location.href = "/interview";
              return;
            }
            if (step === "problems") {
              router.push("/problems");
              return;
            }
            setCurrentStep(step);
            if (isEditingDocument) {
              setDocumentsView("grid");
              setSelectedDocument(null);
              setIsNavCollapsed(false);
              setSidebarVisibleInEditor(false);
            }
          }}
          completedSteps={resumeData ? ["documents"] : []}
          resumeReady={!!resumeData}
          isCollapsed={isNavCollapsed}
          onToggleCollapse={setIsNavCollapsed}
          hideCollapseToggle={isEditingDocument && sidebarVisibleInEditor}
          hideSignOut={isEditingDocument}
        />
      )}
      <main
        className={`${sidebarVisible ? (isNavCollapsed ? "lg:ml-16" : "lg:ml-56") : ""} p-6 transition-[margin-left] duration-200`}
      >
        {!isEditingDocument && (
          <div className="mx-auto mb-4 flex max-w-6xl justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/signin" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </Button>
          </div>
        )}
        {renderStep()}
      </main>
    </div>
  );
}

function HomeView({
  resumeData,
  onNavigate,
}: {
  resumeData: ParsedResume | null;
  onNavigate: (step: NavigationStep) => void;
}) {
  const steps = [
    {
      done: !!resumeData,
      label: "Upload your resume",
      action: () => onNavigate("documents"),
    },
    {
      done: false,
      label: "Add a job description",
      action: () => onNavigate("insights"),
    },
    {
      done: false,
      label: "Practice an interview",
      action: () => onNavigate("interview"),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Upload a resume, find a job, and start practicing.
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ActionCard
          icon={FileText}
          label="Resume"
          onClick={() => onNavigate("documents")}
        />
        <ActionCard
          icon={Briefcase}
          label="Jobs"
          onClick={() => onNavigate("jobs")}
        />
        <ActionCard
          icon={Mic}
          label="Interview"
          onClick={() => onNavigate("interview")}
        />
      </div>

      {/* Checklist */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="text-sm font-semibold">Get started</h3>
          {steps.map((s, i) => (
            <button
              key={i}
              onClick={s.action}
              className="flex items-center gap-3 w-full text-left text-sm hover:bg-muted/50 rounded-md px-2 py-1.5 -mx-2 transition-colors"
            >
              {s.done ? (
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
              <span className={s.done ? "text-muted-foreground line-through" : ""}>
                {s.label}
              </span>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof FileText;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-6 rounded-xl border bg-card hover:bg-accent transition-colors"
    >
      <Icon className="w-6 h-6 text-muted-foreground" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function Section({
  title,
  back,
  action,
  children,
}: {
  title: string;
  back?: () => void;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        {back && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={back}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
        <h2 className="text-xl font-bold flex-1">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}
