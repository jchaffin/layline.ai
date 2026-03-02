"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Target,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Download,
  Sparkles,
  FileText,
  BarChart3,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ParsedResume } from "@/lib/schema";

interface MatchAnalysis {
  matchPercentage: number;
  skillsMatch: {
    matched: string[];
    missing: string[];
    percentage: number;
  };
  experienceMatch: {
    relevantYears: number;
    requiredYears: number;
    levelMatch: string;
    percentage: number;
  };
  educationMatch: {
    meetsRequirements: boolean;
    percentage: number;
  };
  keywordMatch: {
    matched: string[];
    missing: string[];
    percentage: number;
  };
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  improvementPotential: number;
}

interface ResumeMatchAnalysisProps {
  resumeData: ParsedResume;
  jobDescription?: string;
  companyName?: string;
  roleTitle?: string;
  onTailoredResume?: (tailoredResume: ParsedResume) => void;
}

export default function ResumeMatchAnalysis({
  resumeData,
  jobDescription = "",
  companyName = "",
  roleTitle = "",
  onTailoredResume,
}: ResumeMatchAnalysisProps) {
  const { toast } = useToast();
  const [matchAnalysis, setMatchAnalysis] = useState<MatchAnalysis | null>(
    null,
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailoredResume, setTailoredResume] = useState<ParsedResume | null>(
    null,
  );
  const [showTailoredResume, setShowTailoredResume] = useState(false);

  const analyzeMatch = async () => {
    const currentJobDesc = jobDescription || "";
    if (!currentJobDesc.trim()) {
      toast({
        title: "Job description required",
        description: "Please provide a job description to analyze the match.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/resume/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeData,
          jobDescription: currentJobDesc,
        }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();
      setMatchAnalysis(data.matchAnalysis);

      toast({
        title: "Analysis complete",
        description: `Resume match: ${data.matchAnalysis.matchPercentage}%`,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis failed",
        description: "Failed to analyze resume match. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const tailorResume = async () => {
    const currentJobDesc = jobDescription || "";
    if (!currentJobDesc.trim()) {
      toast({
        title: "Job description required",
        description: "Please provide a job description to tailor the resume.",
        variant: "destructive",
      });
      return;
    }

    console.log("Tailoring resume with:", {
      hasResumeData: !!resumeData,
      jobDescLength: currentJobDesc.length,
      companyName,
      roleTitle,
    });

    setIsTailoring(true);
    try {
      const response = await fetch("/api/resume/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeData,
          jobDescription: currentJobDesc,
          companyName,
          roleTitle,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Tailoring API error:", errorText);
        throw new Error(`Tailoring failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("Tailoring response:", data);

      setTailoredResume(data.tailoredResume);
      setShowTailoredResume(true);

      if (onTailoredResume) {
        onTailoredResume(data.tailoredResume);
      }

      toast({
        title: "Resume tailored successfully",
        description: data.s3Url
          ? "Tailored resume saved to cloud storage"
          : "Tailored resume generated",
      });
    } catch (error: any) {
      console.error("Tailoring error:", error);
      toast({
        title: "Tailoring failed",
        description: `Failed to tailor resume: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsTailoring(false);
    }
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getMatchVariant = (percentage: number) => {
    if (percentage >= 80) return "default";
    if (percentage >= 60) return "secondary";
    return "destructive";
  };

  return (
    <div className="space-y-6">
      {/* Analysis Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-500" />
            <span>Resume-Job Match Analysis</span>
          </CardTitle>
          <CardDescription>
            Analyze how well your resume matches the job requirements and get
            tailored suggestions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-3">
            <Button
              onClick={analyzeMatch}
              disabled={isAnalyzing || !(jobDescription || "").trim()}
              className="flex-1"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analyze Match
                </>
              )}
            </Button>
            <Button
              onClick={tailorResume}
              disabled={isTailoring || !(jobDescription || "").trim()}
              variant="outline"
              className="flex-1 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-700 hover:from-purple-100 hover:to-pink-100"
            >
              {isTailoring ? (
                <>
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2" />
                  Tailoring Resume...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Tailored Resume
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Match Analysis Results */}
      {matchAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Match Analysis Results</span>
              <Badge
                variant={getMatchVariant(matchAnalysis.matchPercentage)}
                className="text-lg px-3 py-1"
              >
                {matchAnalysis.matchPercentage}% Match
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Match</span>
                <span className={getMatchColor(matchAnalysis.matchPercentage)}>
                  {matchAnalysis.matchPercentage}%
                </span>
              </div>
              <Progress value={matchAnalysis.matchPercentage} className="h-2" />
            </div>

            <Separator />

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Skills Match</span>
                    <span
                      className={getMatchColor(
                        matchAnalysis.skillsMatch.percentage,
                      )}
                    >
                      {matchAnalysis.skillsMatch.percentage}%
                    </span>
                  </div>
                  <Progress
                    value={matchAnalysis.skillsMatch.percentage}
                    className="h-1"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Experience Match</span>
                    <span
                      className={getMatchColor(
                        matchAnalysis.experienceMatch.percentage,
                      )}
                    >
                      {matchAnalysis.experienceMatch.percentage}%
                    </span>
                  </div>
                  <Progress
                    value={matchAnalysis.experienceMatch.percentage}
                    className="h-1"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Education Match</span>
                    <span
                      className={getMatchColor(
                        matchAnalysis.educationMatch.percentage,
                      )}
                    >
                      {matchAnalysis.educationMatch.percentage}%
                    </span>
                  </div>
                  <Progress
                    value={matchAnalysis.educationMatch.percentage}
                    className="h-1"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Keywords Match</span>
                    <span
                      className={getMatchColor(
                        matchAnalysis.keywordMatch.percentage,
                      )}
                    >
                      {matchAnalysis.keywordMatch.percentage}%
                    </span>
                  </div>
                  <Progress
                    value={matchAnalysis.keywordMatch.percentage}
                    className="h-1"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Strengths and Gaps */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-green-700 mb-3 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Strengths
                </h4>
                <ul className="space-y-2">
                  {matchAnalysis.strengths.map((strength, index) => (
                    <li
                      key={index}
                      className="text-sm text-green-600 flex items-start"
                    >
                      <span className="mr-2">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-red-700 mb-3 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Areas for Improvement
                </h4>
                <ul className="space-y-2">
                  {matchAnalysis.gaps.map((gap, index) => (
                    <li
                      key={index}
                      className="text-sm text-red-600 flex items-start"
                    >
                      <span className="mr-2">•</span>
                      {gap}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommendations */}
            {matchAnalysis.recommendations.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-blue-700 mb-3 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {matchAnalysis.recommendations.map((rec, index) => (
                      <li
                        key={index}
                        className="text-sm text-blue-600 flex items-start"
                      >
                        <span className="mr-2">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* Improvement Potential */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  Improvement Potential
                </span>
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800"
                >
                  Up to {matchAnalysis.improvementPotential}%
                </Badge>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                With targeted improvements, your resume could achieve this match
                percentage
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tailored Resume */}
      {showTailoredResume && tailoredResume && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-green-500" />
                Tailored Resume
              </span>
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </CardTitle>
            <CardDescription>
              Your resume has been optimized for this specific job opportunity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tailoredResume.tailoring_notes && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h5 className="font-semibold text-green-900 mb-2">
                  Key Changes Made:
                </h5>
                <ul className="text-sm text-green-700 space-y-1">
                  {tailoredResume.tailoring_notes.keyChanges?.map(
                    (change, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        {change}
                      </li>
                    ),
                  )}
                </ul>

                {tailoredResume.tailoring_notes?.keywordsAdded &&
                  tailoredResume.tailoring_notes.keywordsAdded.length > 0 && (
                    <div className="mt-3">
                      <h6 className="font-medium text-green-800 mb-1">
                        Keywords Added:
                      </h6>
                      <div className="flex flex-wrap gap-1">
                        {tailoredResume.tailoring_notes?.keywordsAdded?.map(
                          (keyword, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs bg-green-100 text-green-800"
                            >
                              {keyword}
                            </Badge>
                          ),
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}

            <div className="text-sm text-gray-600">
              <p>Resume tailored and saved to cloud storage</p>
              <p>Keywords optimized for ATS compatibility</p>
              <p>Content reordered for maximum impact</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
