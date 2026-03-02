"use client";

import { useState, useEffect } from "react";

import ResumeMatchAnalysis from "@/components/resume/ResumeMatchAnalysis";
import TailoredResumesList from "@/components/resume/TailoredResumesList";
import { Navigation, type NavigationStep } from "@/components/layout/navigation";
import JobAnalysis from "@/components/jobs/JobAnalysis";
import { Button } from "@/components/ui/button";
import { CalendarDemo } from "@/components/shared/calendar-demo";
import JobTracker from "@/components/jobs/JobTracker";
import JobBoard from "@/components/jobs/JobBoard";
import JobSearch from "@/components/jobs/JobSearch";
import JobManager from "@/components/jobs/JobManager";
import ResumeUploadWithPreview from "@/components/resume/ResumeUploadWithPreview";
import DocumentManager from "@/components/documents/document-manager";
import DocumentEditView from "@/components/documents/document-edit-view";
import { useAuthenticatedStorage } from "@/hooks/use-auth-storage";
import {
  CheckCircle,
  FileText,
  Briefcase,
  MessageSquare,
  Mic,
  BarChart3,
  FolderOpen,
  ChevronLeft,
} from "lucide-react";
import type {
  ParsedResume,
  JobAnalysis as JobAnalysisType,
} from "@/lib/schema";

export default function DashboardPage() {
  const [currentStep, setCurrentStep] = useState<NavigationStep>("dashboard");
  const [resumeData, setResumeData] = useState<ParsedResume | null>(null);
  const [jobData, setJobData] = useState<JobAnalysisType | null>(null);
  const [isPrepComplete, setIsPrepComplete] = useState(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);

  const [currentJobDescription, setCurrentJobDescription] = useState<
    string | null
  >(null);
  const [documentsView, setDocumentsView] = useState<'grid' | 'upload' | 'edit'>('grid');
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

  const storage = useAuthenticatedStorage();

  // Load cached resume data on mount (now user-specific)
  useEffect(() => {
    if (storage.isAuthenticated) {
      const cached = storage.getItem('parsedResumeData');
      if (cached && !resumeData) {
        setResumeData(cached);
        console.log("Loaded user-specific resume data:", cached);
      }
    }
  }, [storage.isAuthenticated, resumeData]);

  const handleResumeUploaded = (data: ParsedResume) => {
    console.log("Dashboard handleResumeUploaded called with:", data);
    setResumeData(data);
    storage.setItem('parsedResumeData', data);
    
    // Force navigation to show the uploaded resume immediately
    if (currentStep === "documents") {
      console.log("Already on documents page, data should display");
    }
  };

  const handleJobAnalyzed = ({ 
    description, 
    analysis 
  }: { 
    description: string; 
    analysis: JobAnalysisType;
  }) => {
    setJobData(analysis);
    setCurrentJobDescription(description);
    storage.setItem('currentJobAnalysis', { description, analysis });
  };

  const renderCurrentStep = () => {
    const baseProps = {
      resumeData,
      onResumeUploaded: handleResumeUploaded,
    };

    switch (currentStep) {
      case "dashboard":
        return (
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to Your Dashboard
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Your AI-powered job search and interview preparation platform
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Button
                onClick={() => setCurrentStep("documents")}
                className="h-24 flex flex-col items-center justify-center space-y-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <FileText className="w-8 h-8" />
                <span className="text-lg font-medium">Upload Resume</span>
              </Button>
              <Button
                onClick={() => setCurrentStep("jobs")}
                className="h-24 flex flex-col items-center justify-center space-y-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <Briefcase className="w-8 h-8" />
                <span className="text-lg font-medium">Find Jobs</span>
              </Button>
              <Button
                onClick={() => setCurrentStep("prep")}
                disabled={!resumeData}
                className="h-24 flex flex-col items-center justify-center space-y-2 bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-300"
              >
                <MessageSquare className="w-8 h-8" />
                <span className="text-lg font-medium">Start Prep</span>
              </Button>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Get Started
                </h3>
                <div className="space-y-3">
                  {!resumeData ? (
                    <div className="flex items-center space-x-3 text-sm">
                      <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                      <span className="text-gray-600">Upload your resume</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-gray-600">Resume uploaded</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {resumeData ? (
                    <div className="flex items-center space-x-3 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-gray-600">
                        Resume uploaded and processed
                      </span>
                      <span className="text-gray-400">Just now</span>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      // ... rest of the cases remain the same
      default:
        return <div>Step not implemented</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        completedSteps={resumeData ? ["documents"] : []}
        resumeReady={!!resumeData}
        prepComplete={isPrepComplete}
        isCollapsed={isNavCollapsed}
        onToggleCollapse={setIsNavCollapsed}
      />
      
      <main className={`transition-all duration-300 ${
        isNavCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      } p-8`}>
        {renderCurrentStep()}
      </main>
    </div>
  );
}
