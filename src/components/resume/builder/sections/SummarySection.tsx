"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import type { SectionEditorProps } from "../types";

export default function SummarySection({
  data,
  onUpdate,
  grip,
}: SectionEditorProps<string>) {
  const [isImproving, setIsImproving] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const improveSummaryWithAI = async () => {
    if (!data || data.trim() === "") {
      return;
    }

    setIsImproving(true);
    try {
      const response = await fetch("/api/resume/improve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: "summary",
          content: data,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.improvedContent) {
          onUpdate(result.improvedContent);
        }
      }
    } catch (error) {
      console.error("Error improving summary:", error);
    } finally {
      setIsImproving(false);
    }
  };

  return (
    <Card className="mb-1.5 bg-white border-0 rounded-2xl shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <div className="flex items-center gap-2 min-w-0">
          {grip}
          <h3 className="text-base font-semibold">Professional Summary</h3>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-500 hover:text-gray-700"
            data-collapse-trigger
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
          <RichTextEditor
            value={data || ""}
            onChange={onUpdate}
            placeholder="Write a compelling 2-3 sentence summary of your professional background and key strengths..."
            showWordCount={true}
            showAIButton={true}
            onAIClick={improveSummaryWithAI}
            minHeight="120px"
            disabled={isImproving}
          />
        </CardContent>
      )}
    </Card>
  );
}
