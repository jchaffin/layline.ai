"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Link,
  Globe,
  FileText,
  Sparkles,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

type JobAnalysis = {
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
};

// Single response type
type AnalyzeResponse = {
  description: string;
  analysis?: JobAnalysis; // not optional at the call site, but API may omit
};

// Props use the SAME shape
interface JobAnalysisProps {
  onJobAnalyzed: (data: {
    description: string;
    url?: string;
    analysis: JobAnalysis;
  }) => void;
  currentJob?: {
    description: string;
    url?: string;
    analysis?: JobAnalysis | null;
  } | null;
}
export default function JobAnalysis({
  onJobAnalyzed,
  currentJob,
}: JobAnalysisProps) {
  useEffect(() => {
    setJobUrl(currentJob?.url || "");
    setJobDescription(currentJob?.description || "");
  }, [currentJob]);
  const saveAnalyzedJob = useCallback(
    async (analysis: JobAnalysis, description: string, url?: string) => {
      try {
        const jobData = {
          jobTitle: analysis.role,
          company: analysis.company,
          jobUrl: url || "",
          status: "applied" as const,
          location: analysis.location,
          notes: `Analyzed job: ${analysis.companyInfo}`,
          userId: "demo-user",
        };

        const response = await fetch("/api/jobs/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jobData),
        });

        if (!response.ok) {
          console.error("Failed to save job to tracker");
        }
      } catch (error) {
        console.error("Error saving job to tracker:", error);
      }
    },
    [],
  );
  const { toast } = useToast();
  const [jobUrl, setJobUrl] = useState(currentJob?.url || "");
  const [jobDescription, setJobDescription] = useState(
    currentJob?.description || "",
  );
  const [jobTitle, setJobTitle] = useState("AI Product Engineer, Mid-Level");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const analyzeJobFromUrl = useCallback(async () => {
    if (!jobUrl.trim()) {
      toast({
        title: "Missing URL",
        description: "Please enter a job posting URL.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      // Check if it's a LinkedIn URL with currentJobId
      if (jobUrl.includes('linkedin.com/jobs/search') && jobUrl.includes('currentJobId')) {
        console.log('Detected LinkedIn search URL, using specialized extraction');
        
        // Use the LinkedIn extraction API
        const linkedinResponse = await fetch("/api/jobs/extract-linkedin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            url: jobUrl,
            jobTitle: jobTitle
          }),
        });

        if (!linkedinResponse.ok) {
          throw new Error("Failed to extract LinkedIn job");
        }

        const linkedinData = await linkedinResponse.json();
        
        if (linkedinData.success && linkedinData.job) {
          const job = linkedinData.job;
          
          // Use the extracted job description for analysis
          const analysisResponse = await fetch("/api/job/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              description: job.description,
              url: job.url 
            }),
          });

          if (!analysisResponse.ok) throw new Error("Failed to analyze extracted job");
          const data = (await analysisResponse.json()) as AnalyzeResponse;
          
          setJobDescription(job.description);

          // Save the analyzed job to the job tracker
          await saveAnalyzedJob(data.analysis, job.description, job.url);

          onJobAnalyzed({
            description: job.description,
            url: job.url,
            analysis: data.analysis,
          });

          toast({
            title: "LinkedIn job extracted and analyzed successfully",
            description: `Extracted: ${job.title} at ${job.company}`,
          });
          
          return;
        }
      }

      // Fallback to regular job analysis
      const response = await fetch("/api/job/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobUrl }),
      });

      if (!response.ok) throw new Error("Failed to analyze job posting");
      const data = (await response.json()) as AnalyzeResponse;
      if (!data.analysis) throw new Error("Missing analysis");

      setJobDescription(data.description);

      // Save the analyzed job to the job tracker
      await saveAnalyzedJob(data.analysis, data.description, jobUrl);

      onJobAnalyzed({
        description: data.description,
        url: jobUrl,
        analysis: data.analysis,
      });

      toast({
        title: "Job analyzed and saved successfully",
        description:
          "Job requirements extracted, analyzed, and added to your job tracker.",
      });
    } catch (error) {
      toast({
        title: "Analysis failed",
        description:
          "Could not fetch or analyze the job posting. Please try manual entry.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [jobUrl, jobTitle, onJobAnalyzed, toast, saveAnalyzedJob]);

  const analyzeJobDescription = useCallback(async () => {
    if (!jobDescription.trim()) {
      toast({
        title: "Missing description",
        description: "Please enter a job description.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/job/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: jobDescription }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze job description");
      }

      const data = await response.json();

      // Save the analyzed job to the job tracker
      await saveAnalyzedJob(data.analysis, jobDescription, jobUrl);

      onJobAnalyzed({
        description: jobDescription,
        url: jobUrl || undefined,
        analysis: data.analysis,
      });

      toast({
        title: "Job analyzed and saved successfully",
        description:
          "Job requirements extracted, analyzed, and added to your job tracker.",
      });
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: "Could not analyze the job description. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [jobDescription, jobUrl, onJobAnalyzed, toast, saveAnalyzedJob]);

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getMatchScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent Match";
    if (score >= 60) return "Good Match";
    return "Needs Improvement";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-blue-500" />
            <span>Job Analysis</span>
          </CardTitle>
          <CardDescription>
            Analyze the job posting to tailor your interview preparation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* URL Input */}
          <div className="space-y-3">
            <Label htmlFor="job-url">Job Posting URL (Optional)</Label>
            <div className="flex space-x-2">
              <Input
                id="job-url"
                placeholder="https://company.com/careers/job-id"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                disabled={isAnalyzing}
              />
              <Button
                onClick={analyzeJobFromUrl}
                disabled={isAnalyzing || !jobUrl.trim()}
                variant="outline"
              >
                <Link className="w-4 h-4 mr-1" />
                Fetch
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              We'll automatically extract the job description from supported job
              sites
            </p>
          </div>

          {/* Job Title for LinkedIn Extraction */}
          {jobUrl.includes('linkedin.com/jobs/search') && jobUrl.includes('currentJobId') && (
            <div className="space-y-3">
              <Label htmlFor="job-title">Job Title to Extract (Optional)</Label>
              <Input
                id="job-title"
                placeholder="AI Product Engineer, Mid-Level"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                disabled={isAnalyzing}
              />
              <p className="text-xs text-gray-500">
                Specify the exact job title to extract from LinkedIn search results
              </p>
              <Button
                onClick={analyzeJobFromUrl}
                disabled={isAnalyzing || !jobUrl.trim()}
                variant="outline"
                size="sm"
              >
                <Link className="w-4 h-4 mr-1" />
                Extract & Analyze LinkedIn Job
              </Button>
            </div>
          )}

          {/* Manual Description */}
          <div className="space-y-3">
            <Label htmlFor="job-description">Job Description</Label>
            <Textarea
              id="job-description"
              placeholder="Paste the complete job description here..."
              rows={8}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              disabled={isAnalyzing}
            />
          </div>

          {/* Analyze Button */}
          <Button
            onClick={analyzeJobDescription}
            disabled={isAnalyzing || !jobDescription.trim()}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze Job Requirements
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {currentJob?.analysis && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-green-500" />
                <span>Analysis Results</span>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAnalysis(!showAnalysis)}
              >
                {showAnalysis ? "Hide Details" : "Show Details"}
              </Button>
            </div>
            <CardDescription>
              Job requirements matched against your profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Match Score */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
              <div>
                <p className="text-sm text-gray-600">Profile Match Score</p>
                <p
                  className={`text-2xl font-bold ${getMatchScoreColor(Math.round(currentJob.analysis.sentiment * 100))}`}
                >
                  {Math.round(currentJob.analysis.sentiment * 100)}%
                </p>
                <p
                  className={`text-sm ${getMatchScoreColor(Math.round(currentJob.analysis.sentiment * 100))}`}
                >
                  {getMatchScoreLabel(
                    Math.round(currentJob.analysis.sentiment * 100),
                  )}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">
                    {currentJob.analysis?.strongPoints?.length ||
                      currentJob.analysis?.requiredSkills?.length ||
                      0}{" "}
                    Key Requirements
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-gray-600">
                    {currentJob.analysis?.missingSkills?.length ||
                      currentJob.analysis?.preferredSkills?.length ||
                      0}{" "}
                    Preferred Skills
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="font-medium text-green-600 mb-2">
                  Your Strengths
                </h4>
                <div className="space-y-1">
                  {(
                    currentJob.analysis?.strongPoints ||
                    currentJob.analysis?.requiredSkills ||
                    []
                  )
                    .slice(0, 3)
                    .map((point, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{point}</span>
                      </div>
                    ))}
                  {(
                    currentJob.analysis?.strongPoints ||
                    currentJob.analysis?.requiredSkills ||
                    []
                  ).length > 3 && (
                    <p className="text-xs text-gray-500">
                      +
                      {(
                        currentJob.analysis?.strongPoints ||
                        currentJob.analysis?.requiredSkills ||
                        []
                      ).length - 3}{" "}
                      more requirements
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-orange-600 mb-2">
                  Focus Areas
                </h4>
                <div className="space-y-1">
                  {(
                    currentJob.analysis?.missingSkills ||
                    currentJob.analysis?.preferredSkills ||
                    []
                  )
                    .slice(0, 3)
                    .map((skill, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <AlertTriangle className="w-3 h-3 text-orange-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{skill}</span>
                      </div>
                    ))}
                  {(
                    currentJob.analysis?.missingSkills ||
                    currentJob.analysis?.preferredSkills ||
                    []
                  ).length > 3 && (
                    <p className="text-xs text-gray-500">
                      +
                      {(
                        currentJob.analysis?.missingSkills ||
                        currentJob.analysis?.preferredSkills ||
                        []
                      ).length - 3}{" "}
                      more areas
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Detailed Analysis */}
            {showAnalysis && (
              <ScrollArea className="h-96">
                <div className="space-y-6">
                  {/* Requirements */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Key Requirements
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(currentJob.analysis?.qualifications || []).map(
                        (req: string, index: number) => (
                          <Badge key={index} variant="outline">
                            {req}
                          </Badge>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Preferred Skills */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Preferred Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(currentJob.analysis?.preferredSkills || []).map(
                        (skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Responsibilities */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Key Responsibilities
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      {(currentJob.analysis?.responsibilities || []).map(
                        (resp, index) => (
                          <li
                            key={index}
                            className="flex items-start space-x-2"
                          >
                            <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                            <span>{resp}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>

                  {/* Company Info */}
                  {currentJob.analysis?.companyInfo && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Company Context
                      </h4>
                      <p className="text-sm text-gray-700">
                        {currentJob.analysis.companyInfo}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
