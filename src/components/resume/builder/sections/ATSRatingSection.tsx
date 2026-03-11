"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export default function ATSRatingSection({
  resumeData,
  onDataChange,
}: {
  resumeData: any;
  onDataChange: (data: any) => void;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const atsScore = parseInt(resumeData?.ats_score || "0");
  const recommendations = resumeData?.ats_recommendations || [];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 60) return <TrendingUp className="w-5 h-5 text-yellow-600" />;
    return <AlertCircle className="w-5 h-5 text-red-600" />;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs Improvement";
  };

  const improveATSWithAI = async () => {
    setIsImproving(true);
    try {
      const response = await fetch("/api/resume/improve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeData,
          focusArea: "ats_optimization",
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          onDataChange(result.data);
        }
      }
    } catch (error) {
      console.error("Error improving ATS score:", error);
    } finally {
      setIsImproving(false);
    }
  };

  return (
    <Card className="mb-1.5 bg-white border-0 rounded-2xl shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-lg font-semibold">ATS Compatibility Analysis</h3>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            Auto-Generated
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={improveATSWithAI}
            variant="outline"
            size="sm"
            className="text-purple-600 hover:text-purple-700 border-purple-200 hover:border-purple-300"
            disabled={isImproving}
          >
            {isImproving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                Improving...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Improve with AI
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent className="space-y-4">
          <div className={`rounded-lg p-4 border-2 ${getScoreColor(atsScore)}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                {getScoreIcon(atsScore)}
                <div>
                  <div className="text-2xl font-bold">{atsScore}%</div>
                  <div className="text-sm font-medium">
                    {getScoreLabel(atsScore)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-600">ATS Score</div>
                <div className="text-xs text-gray-500">
                  Applicant Tracking System
                </div>
              </div>
            </div>

            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  atsScore >= 80
                    ? "bg-green-500"
                    : atsScore >= 60
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${Math.min(atsScore, 100)}%` }}
              ></div>
            </div>
          </div>

          {recommendations.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Recommendations for Improvement:
              </Label>
              <div className="space-y-2">
                {recommendations.map((rec: string, index: number) => (
                  <div
                    key={index}
                    className="flex items-start space-x-2 p-2 bg-blue-50 rounded-md"
                  >
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-blue-800">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
            <strong>About ATS Compatibility:</strong> This score indicates how
            well your resume will be parsed by Applicant Tracking Systems (ATS)
            used by employers. Higher scores mean better keyword matching,
            formatting, and structure.
          </div>
        </CardContent>
      )}
    </Card>
  );
}
