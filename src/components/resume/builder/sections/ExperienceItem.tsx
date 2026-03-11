"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ChevronDown, ChevronUp, Save, Trash2 } from "lucide-react";
import SimpleDatePicker from "@/components/ui/UnifiedDatePicker";
import { GooglePlacesAutocomplete } from "@/components/shared/AutoComplete";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import type { DeletableSectionEditorProps } from "../types";

export default function ExperienceItem({
  data: experience,
  onUpdate,
  onDelete,
  grip,
}: DeletableSectionEditorProps) {
  const [isImproving, setIsImproving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const updateField = (field: string, value: any) => {
    onUpdate({ ...experience, [field]: value });
    if (field === "description") {
      setHasUnsavedChanges(true);
    }
  };

  const improveDescriptionWithAI = async () => {
    if (!experience.description || experience.description.trim() === "") {
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
          section: "experience",
          content: experience.description,
          context: {
            role: experience.role,
            company: experience.company,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.improvedContent) {
          updateField("description", result.improvedContent);
          setHasUnsavedChanges(true);
        }
      }
    } catch (error) {
      console.error("Error improving description:", error);
    } finally {
      setIsImproving(false);
    }
  };

  const saveChanges = () => {
    setHasUnsavedChanges(false);
  };

  return (
    <Card className="mb-1.5 bg-white border-0 rounded-2xl shadow-none">
      <CardHeader className="pb-1.5">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {grip}
            <h4 className="text-lg font-semibold">
              {experience.role || "New Position"}
            </h4>
          </div>
          <div className="flex items-center space-x-1">
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
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label>Company</Label>
              <Input
                value={experience.company || ""}
                onChange={(e) => updateField("company", e.target.value)}
                placeholder="Company name"
              />
            </div>
            <div>
              <Label>Job Title</Label>
              <Input
                value={experience.role || ""}
                onChange={(e) => updateField("role", e.target.value)}
                placeholder="Your role"
              />
            </div>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <SimpleDatePicker
                value={experience.startDate}
                onChange={(date) => updateField("startDate", date)}
                placeholder="Start date"
              />
            </div>
            <span className="text-muted-foreground pb-2.5">—</span>
            <div className="flex-1">
              {experience.isCurrentRole ? (
                <button
                  type="button"
                  onClick={() => updateField("isCurrentRole", false)}
                  className="h-9 w-full px-3 border border-blue-300 bg-blue-50 rounded-md flex items-center justify-center text-sm font-medium text-blue-600 hover:bg-blue-100 transition-colors"
                >
                  Present
                </button>
              ) : (
                <SimpleDatePicker
                  value={experience.endDate}
                  onChange={(date) => {
                    onUpdate({
                      ...experience,
                      endDate: date,
                      ...(date ? { isCurrentRole: false } : {}),
                    });
                  }}
                  placeholder="End date"
                />
              )}
            </div>
            {!experience.endDate && !experience.isCurrentRole && (
              <button
                type="button"
                onClick={() => {
                  updateField("isCurrentRole", true);
                  updateField("endDate", undefined);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium pb-2.5 shrink-0 whitespace-nowrap"
              >
                Current role?
              </button>
            )}
            <div className="flex-1">
              <GooglePlacesAutocomplete
                value={
                  experience.location === "undefined"
                    ? ""
                    : experience.location || ""
                }
                onChange={(value) => updateField("location", value)}
                placeholder="City, State"
              />
            </div>
          </div>

          <div>
            <Label>Description & Achievements</Label>
            <RichTextEditor
              value={experience.description || ""}
              onChange={(val) => updateField("description", val)}
              placeholder="• Led development of new features&#10;• Managed team of 5 developers"
              showWordCount={false}
              showAIButton={true}
              onAIClick={improveDescriptionWithAI}
              maxChars={2000}
            />
          </div>

          {hasUnsavedChanges && (
            <div className="flex justify-end">
              <Button onClick={saveChanges} size="sm" variant="outline">
                <Save className="w-4 h-4 mr-2" />
                Mark Saved
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
