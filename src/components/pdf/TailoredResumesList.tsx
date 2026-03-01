"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Download,
  Trash2,
  Calendar,
  Building,
  Briefcase,
  RefreshCw,
  CloudOff,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ResumeStyleSelector } from "@/components/resume-style-selector";
import StructuredResumePreview from "@/components/structured-resume-preview";

interface TailoredResume {
  key: string;
  size: number;
  lastModified: string;
  companyName: string;
  roleTitle: string;
  createdAt: string;
  s3Url: string;
  metadata: {
    hasOriginal: boolean;
    hasTailored: boolean;
    hasJobDescription: boolean;
  };
  error?: string;
}

interface TailoredResumesListProps {
  className?: string;
}

export default function TailoredResumesList({
  className,
}: TailoredResumesListProps) {
  const { toast } = useToast();
  const [resumes, setResumes] = useState<TailoredResume[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{
    key: string;
    content: string;
    structuredData?: any;
    metadata?: any;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const loadResumes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/resume/list");

      if (!response.ok) {
        throw new Error("Failed to load resumes");
      }

      const data = await response.json();
      setResumes(data.resumes || []);

      if (data.message) {
        toast({
          title: "Info",
          description: data.message,
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Error loading resumes",
        description: "Failed to load tailored resumes from storage.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteResume = async (key: string) => {
    setIsDeleting(key);
    try {
      const response = await fetch(
        `/api/resume/list?key=${encodeURIComponent(key)}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete resume");
      }

      setResumes(resumes.filter((resume) => resume.key !== key));
      toast({
        title: "Resume deleted",
        description: "Tailored resume has been removed from storage.",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete the resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Unknown date";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const previewResume = async (key: string) => {
    try {
      const response = await fetch(
        `/api/resume/preview?key=${encodeURIComponent(key)}`,
      );

      if (!response.ok) {
        throw new Error("Failed to load resume preview");
      }

      const data = await response.json();
      setPreviewData({
        key: key,
        content: data.preview || "No preview available",
        structuredData: data.structuredData,
        metadata: data.metadata,
      });
      setShowPreview(true);
    } catch (error) {
      toast({
        title: "Preview failed",
        description: "Failed to load resume preview. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-purple-500" />
                <span>Tailored Resumes</span>
              </CardTitle>
              <CardDescription>
                Manage your job-specific tailored resumes stored in the cloud
              </CardDescription>
            </div>
            <Button
              onClick={loadResumes}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {resumes.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <CloudOff className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-gray-600 font-medium">
                  No tailored resumes found
                </p>
                <p className="text-sm text-gray-500">
                  Upload a resume and analyze a job posting to create tailored
                  resumes automatically
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Note: Legacy resumes may need to be recreated due to format
                  updates
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {resumes.map((resume) => (
                  <Card key={resume.key} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Building className="w-4 h-4 text-blue-500" />
                          <span className="font-medium text-gray-900">
                            {resume.companyName}
                          </span>
                          {resume.error && (
                            <Badge variant="destructive" className="text-xs">
                              Error
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <Briefcase className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-700">
                            {resume.roleTitle}
                          </span>
                        </div>

                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(resume.lastModified)}</span>
                          </div>
                          <span>{formatFileSize(resume.size)}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          {resume.metadata?.hasOriginal && (
                            <Badge variant="secondary" className="text-xs">
                              Original
                            </Badge>
                          )}
                          {resume.metadata?.hasTailored && (
                            <Badge variant="secondary" className="text-xs">
                              Tailored
                            </Badge>
                          )}
                          {resume.metadata?.hasJobDescription && (
                            <Badge variant="secondary" className="text-xs">
                              Job Match
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => previewResume(resume.key)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <ResumeStyleSelector
                          resumeKey={resume.key}
                          companyName={resume.companyName}
                          roleTitle={resume.roleTitle}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Quick download with default modern style
                            const downloadUrl = `/api/resume/download?key=${encodeURIComponent(resume.key)}&style=modern`;
                            const link = document.createElement("a");
                            link.href = downloadUrl;
                            link.download = `${resume.companyName}_${resume.roleTitle}_Resume.pdf`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);

                            toast({
                              title: "Download started",
                              description:
                                "Your tailored resume is being downloaded as PDF.",
                            });
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteResume(resume.key)}
                          disabled={isDeleting === resume.key}
                          className="text-red-600 hover:bg-red-50"
                        >
                          {isDeleting === resume.key ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden bg-white">
          <DialogHeader>
            <DialogTitle>Tailored Resume Preview</DialogTitle>
            <DialogDescription>
              {previewData?.metadata?.company && previewData?.metadata?.role
                ? `${previewData.metadata.company} - ${previewData.metadata.role}`
                : "Preview of tailored resume content"}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] mt-4 bg-white">
            <div className="bg-white p-4">
              {previewData?.structuredData ? (
                <StructuredResumePreview
                  resumeData={previewData.structuredData}
                  title="Tailored Resume"
                  className=""
                />
              ) : (
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
                  {typeof previewData?.content === "string"
                    ? previewData.content
                    : "Loading..."}
                </pre>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
