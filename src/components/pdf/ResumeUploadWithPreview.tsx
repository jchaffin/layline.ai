"use client";

import { useState } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  X,
  FileText,
  ChevronDown,
  GripVertical,
} from "lucide-react";
import ResumeUpload from "@/components/pdf/ResumeUpload";
import PDFPreviewPane from "@/components/pdf/PDFPreviewPane";

type ParsedResume = {
  // mirror what your ResumeUpload emits
  summary: string;
  skills: string[];
  jobTitle?: string;
  experience: Array<{
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
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field?: string;
    year: string;
    graduationDate?: Date;
    location?: string;
    gpa?: string;
    honors?: string;
  }>;
  contact: {
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    location?: string;
    address?: string;
    country?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  ats_score: string;
  ats_recommendations: string[];
  tailoring_notes?: {
    keyChanges?: string[];
    keywordsAdded?: string[];
    focusAreas?: string[];
  };
};

interface ResumeUploadWithPreviewProps {
  onResumeUploaded: (resume: ParsedResume | null) => void;
  currentResume: ParsedResume | null;
  autoParseExisting?: boolean;
  onNavigateToJobs: () => void;
  onNavigateToDocs?: () => void;
}

export default function ResumeUploadWithPreview({
  onResumeUploaded,
  currentResume,
  autoParseExisting = false,
  onNavigateToJobs,
}: ResumeUploadWithPreviewProps) {
  const [showPreview, setShowPreview] = useState(true);
  const [previewWidth, setPreviewWidth] = useState(560);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const container = document.querySelector('.resize-container') as HTMLElement;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const newWidth = containerRect.right - e.clientX;
    
    const constrainedWidth = Math.max(300, Math.min(800, newWidth));
    setPreviewWidth(constrainedWidth);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);



  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row lg:items-stretch resize-container">
      {/* Resume Upload Form - Better responsive layout */}
      <div className={`flex-1 w-full min-w-0 min-h-0 overflow-y-auto bg-gray-50 p-4 lg:p-6 transition-all duration-300`}>
        <ResumeUpload
          onResumeUploaded={onResumeUploaded}
          currentResume={currentResume}
        />

        {/* Quick Actions Card */}
        {currentResume && currentResume.summary && (currentResume.contact?.name || currentResume.contact?.firstName) && currentResume.experience && currentResume.experience.length > 0 && (
          <Card className="bg-blue-50 border-blue-200 mt-6">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-blue-900 text-lg">
                    Resume Ready
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    Your resume has been processed successfully
                  </CardDescription>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-700"
                >
                  Processed
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button
                  onClick={onNavigateToJobs}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Add Job to Match
                </Button>
                <Button
                  onClick={() => setShowPreview(!showPreview)}
                  variant="outline"
                  size="sm"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  {showPreview ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Hide Preview
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Show Preview
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-blue-600 leading-relaxed">
                Add a job description to create tailored resumes and get
                detailed match analysis. {showPreview ? 'The preview panel shows your uploaded PDF in real-time.' : 'Click "Show Preview" to see your PDF.'}
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Expand Preview Tab - Show when collapsed */}
        {!showPreview && currentResume && currentResume.summary && (currentResume.contact?.name || currentResume.contact?.firstName) && currentResume.experience && currentResume.experience.length > 0 && (
          <div className="fixed right-0 top-1/2 transform -translate-y-1/2 z-20">
            <Button
              onClick={() => setShowPreview(true)}
              variant="ghost"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg h-16 w-6 p-0 rounded-l-lg rounded-r-none border-0 flex flex-col items-center justify-center gap-1"
              title="Open preview panel"
            >
              <ChevronLeft className="w-3 h-3" />
              <div className="text-xs font-medium transform -rotate-90 whitespace-nowrap">Preview</div>
            </Button>
          </div>
        )}
      </div>

      {/* Resizable Divider */}
      {showPreview && (
        <div
          className="hidden lg:flex w-2 bg-gray-200 hover:bg-blue-500 cursor-col-resize items-center justify-center transition-all duration-200 relative group border-l border-gray-300"
          onMouseDown={handleMouseDown}
        >
          <div className="w-1 h-8 bg-gray-400 group-hover:bg-white rounded-full transition-colors duration-200"></div>
        </div>
      )}

      {/* PDF Preview Panel - Resizable */}
      <div 
        className={`${showPreview ? 'w-full lg:flex-none' : 'w-0 lg:w-0'} min-w-0 min-h-0 border-t lg:border-t-0 border-gray-200 bg-white transition-all duration-300 overflow-hidden shadow-lg`}
        style={{ width: showPreview ? `${previewWidth}px` : '0px' }}
      >
        {showPreview && (
          <>

            
            {/* Simple Preview Content */}
            {currentResume && currentResume.summary && (currentResume.contact?.name || currentResume.contact?.firstName) && currentResume.experience && currentResume.experience.length > 0 ? (
              <div className="h-full overflow-hidden">
                <PDFPreviewPane 
                  key={JSON.stringify(currentResume)} 
                  resumeData={currentResume}
                  onClose={() => setShowPreview(false)}
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">
                    {currentResume ? "Processing resume data..." : "Upload a resume to see the preview"}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
