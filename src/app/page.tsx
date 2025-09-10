"use client";

import { useState, useEffect } from "react";

import ResumeMatchAnalysis from "@/components/pdf/ResumeMatchAnalysis";
import TailoredResumesList from "@/components/pdf/TailoredResumesList";
import { Navigation, type NavigationStep } from "@/components/navigation";
import JobAnalysis from "@/components/job/JobAnalysis";
import { Button } from "@/components/ui/button";
import InterviewAssistant from "@/components/interview/InterviewAssistant";
import InterviewerAgent from "@/components/interview/InterviewAgent"
import { CalendarDemo } from "@/components/calendar-demo";
import JobTracker from "@/components/job/JobTracker";
import JobBoard from "@/components/job/JobBoard";
import JobSearch from "@/components/job/JobSearch";
import JobManager from "@/components/job/JobManager";
import ResumeUploadWithPreview from "@/components/pdf/ResumeUploadWithPreview";
import DocumentManager from "@/components/document-manager";
import DocumentEditView from "@/components/document-edit-view";
import InterviewPrep from "@/components/interview/InterviewPrep";
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

export default function HomePage() {
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

  // Load cached resume data on mount
  useEffect(() => {
    const cached = localStorage.getItem('parsedResumeData');
    if (cached && !resumeData) {
      try {
        const data = JSON.parse(cached);
        setResumeData(data);
        console.log("Loaded resume data from localStorage:", data);
      } catch (error) {
        console.error('Error loading cached resume:', error);
      }
    }
  }, [resumeData]);

  const handleResumeUploaded = (data: ParsedResume) => {
    console.log("Page handleResumeUploaded called with:", data);
    setResumeData(data);
    // Force navigation to show the uploaded resume immediately
    if (currentStep === "documents") {
      // Already on documents page, data will show
      console.log("Already on documents page, data should display");
    }
  };

  const handleJobAnalyzed = (data: {
    description: string;
    url?: string;
    analysis: JobAnalysisType;
  }) => {
    setJobData(data.analysis);
    setCurrentJobDescription(data.description);
    console.log(
      "Job analyzed with description:",
      data.description.slice(0, 100) + "...",
    );
  };

  const handlePrepComplete = () => {
    setIsPrepComplete(true);
  };

  const handleStepChange = (step: NavigationStep) => {
    setCurrentStep(step);
    // Auto-collapse navigation when entering documents/edit view
    if (step === "documents") {
      setIsNavCollapsed(true);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "dashboard":
        return (
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Interview Assistant Dashboard
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Your complete interview preparation platform - from resume
                optimization to live interview assistance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Quick Stats */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Documents</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Resumes</span>
                    <span className="font-medium">
                      {resumeData ? "1" : "0"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span
                      className={`font-medium ${resumeData ? "text-green-600" : "text-gray-400"}`}
                    >
                      {resumeData ? "Ready" : "Upload needed"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Interview Prep
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Progress</span>
                    <span
                      className={`font-medium ${isPrepComplete ? "text-green-600" : "text-gray-400"}`}
                    >
                      {isPrepComplete ? "Complete" : "Not started"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Questions</span>
                    <span className="font-medium">0 practiced</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Job Applications
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tracked</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Interviews</span>
                    <span className="font-medium">0 scheduled</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-blue-100 p-6 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  onClick={() => setCurrentStep("documents")}
                  className="bg-white text-blue-700 hover:bg-blue-100 border border-blue-200"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {resumeData ? "Manage Resume" : "Upload Resume"}
                </Button>
                <Button
                  onClick={() => setCurrentStep("jobs")}
                  className="bg-white text-blue-700 hover:bg-blue-100 border border-blue-200"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Add Job
                </Button>
                <Button
                  onClick={() => setCurrentStep("prep")}
                  disabled={!resumeData}
                  className="bg-white text-blue-700 hover:bg-blue-100 border border-blue-200 disabled:bg-gray-300"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Start Prep
                </Button>
                <Button
                  onClick={() => setCurrentStep("interview")}
                  disabled={!resumeData || !isPrepComplete}
                  className="bg-white text-blue-700 hover:bg-blue-100 border border-blue-200 disabled:bg-gray-300"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Live Interview
                </Button>
              </div>
            </div>

            {/* Recent Activity */}
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
                  <div className="text-gray-500 text-sm">
                    No recent activity
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "documents":
        if (documentsView === 'upload') {
          return (
            <div className="h-screen">
              <ResumeUploadWithPreview
                onResumeUploaded={(data) => {
                  handleResumeUploaded(data);
                  setDocumentsView('grid'); // Return to grid after upload
                }}
                currentResume={resumeData}
                onNavigateToJobs={() => setCurrentStep("jobs")}
              />
            </div>
          );
        }
        
        if (documentsView === 'edit' && selectedDocument) {
          return (
            <DocumentEditView 
              document={selectedDocument}
              onBack={() => {
                setDocumentsView('grid');
                setSelectedDocument(null);
              }}
              onSave={(data) => {
                handleResumeUploaded(data);
                setDocumentsView('grid');
                setSelectedDocument(null);
              }}
            />
          );
        }
        
        return (
          <DocumentManager 
            currentResume={resumeData}
            onDocumentSelect={(document) => {
              console.log('Selected document:', document);
            }}
            onNavigateToUpload={() => setDocumentsView('upload')}
            onNavigateToEdit={(document) => {
              setSelectedDocument(document);
              setDocumentsView('edit');
            }}
          />
        );

      case "jobs":
        return (
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Job Search & Application Tracker
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Search jobs from multiple sources and track your applications in one place.
              </p>
            </div>
            <JobManager />
          </div>
        );

      case "job-board":
        return (
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Advanced Job Board
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Comprehensive job search with advanced filtering, sorting, and
                management tools powered by Indeed, LinkedIn, and Glassdoor.
              </p>
            </div>

            <JobBoard
              resumeData={resumeData}
              onJobSelect={(job) => {
                // When a job is selected from board, can integrate with application tracking
                console.log("Selected job from board:", job);
                // Could auto-switch to jobs tab and pre-populate application form
              }}
            />
          </div>
        );

      case "insights":
        return (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Analytics & Insights
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Track your interview performance and resume effectiveness.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg border border-gray-200">
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No data available yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Complete some interview prep sessions to see your progress and
                  insights.
                </p>
                <Button
                  onClick={() => setCurrentStep("prep")}
                  disabled={!resumeData}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Start Interview Prep
                </Button>
              </div>
            </div>
          </div>
        );

      case "other":
        return (
          <div className="space-y-8">
            <CalendarDemo />

            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  Settings & Tools
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  Additional tools, settings, and configuration options.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Account Settings
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Manage your profile and preferences
                  </p>
                  <Button variant="outline" className="w-full">
                    Configure Settings
                  </Button>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Export Data
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Download your resumes and interview data
                  </p>
                  <Button variant="outline" className="w-full">
                    Export Data
                  </Button>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    API Access
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Integrate with external tools and services
                  </p>
                  <Button variant="outline" className="w-full">
                    Manage API Keys
                  </Button>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Help & Support
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Documentation and support resources
                  </p>
                  <Button variant="outline" className="w-full">
                    View Documentation
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case "prep":
        return (
          <div className="max-w-6xl mx-auto">
            <InterviewPrep onPrepComplete={handlePrepComplete} />
          </div>
        );

      case "interview":
        // Redirect to the dedicated interview page
        window.location.href = "/interview";
        return (
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Redirecting to Live Interview...
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Loading your AI-powered interview assistant with real-time
                support.
              </p>
            </div>

            {/* Interview Mode Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <Mic className="w-6 h-6 mr-2 text-blue-600" />
                  Live Interview Support
                </h3>
                <p className="text-gray-600 mb-4">
                  Real-time transcription and AI suggestions during your actual
                  interview.
                </p>
                <Button
                  onClick={() => setCurrentStep("live-interview")}
                  className="w-full"
                >
                  Start Live Support
                </Button>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <MessageSquare className="w-6 h-6 mr-2 text-green-600" />
                  Mock Interview Practice
                </h3>
                <p className="text-gray-600 mb-4">
                  Practice with an AI interviewer using realistic questions and
                  voice interaction.
                </p>
                <Button
                  onClick={() => setCurrentStep("mock-interview")}
                  variant="outline"
                  className="w-full"
                >
                  Start Mock Interview
                </Button>
              </div>
            </div>
          </div>
        );

      case "live-interview":
        return (
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center mb-6">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep("interview")}
              >
                ← Back to Interview Options
              </Button>
            </div>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Live Interview Assistant
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Real-time AI assistance during your interview with live
                transcription and smart suggestions.
              </p>
            </div>

            <InterviewAssistant 
              session={{
                id: "demo-session",
                status: "active",
                jobDescription: currentJobDescription || "",
                companyName: jobData?.company || "",
                roleTitle: jobData?.role || "",
                interviewType: "live"
              }}
              isRecording={false}
              transcription={[]}
              onSuggestion={(suggestion) => console.log("Suggestion:", suggestion)}
              onTranscription={(text) => console.log("Transcription:", text)}
            />
          </div>
        );

      case "mock-interview":
        return (
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center mb-6">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep("interview")}
              >
                ← Back to Interview Options
              </Button>
            </div>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                AI Mock Interview
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Practice with a realistic AI interviewer powered by ElevenLabs
                voice synthesis.
              </p>
            </div>

            <InterviewerAgent
              session={{
                id: "demo-interview",
                status: "active",
                jobDescription: currentJobDescription || "",
                companyName: jobData?.company || "Tech Company",
                roleTitle: jobData?.role || "Software Engineer",
                interviewType: "general"
              }}
              isRecording={false}
              onTranscription={(text) => console.log("Transcription:", text)}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation
        currentStep={currentStep}
        onStepChange={handleStepChange}
        completedSteps={[]}
        resumeReady={!!resumeData}
        prepComplete={isPrepComplete}
        isCollapsed={isNavCollapsed}
        onToggleCollapse={setIsNavCollapsed}
      />

      {/* Main content */}
      <div
        className={`transition-all duration-300 ${isNavCollapsed ? "lg:ml-16" : "lg:ml-64"}`}
      >
        {currentStep === "documents" ? (
          <div className="h-screen flex">
            {renderCurrentStep()}
          </div>
        ) : (
          <div className="p-4 lg:p-8">{renderCurrentStep()}</div>
        )}
      </div>

      {/* Floating Documents Button - appears on left side when not on documents page */}
      {currentStep !== "documents" && (
        <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50">
          <Button
            onClick={() => setCurrentStep("documents")}
            className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            title="Go to Documents"
          >
            <FolderOpen className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
