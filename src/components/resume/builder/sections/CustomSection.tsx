"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import {
  Award,
  Briefcase,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Trash2,
} from "lucide-react";
import type { DeletableSectionEditorProps } from "../types";

export default function CustomSection({
  data,
  onUpdate,
  onDelete,
  grip,
}: DeletableSectionEditorProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const updateField = (field: string, value: any) => {
    onUpdate({ ...data, [field]: value });
  };

  const handleTitleSave = () => {
    setIsEditingTitle(false);
  };

  if (data.isHeader) {
    return (
      <div className="mb-1.5 mt-2 first:mt-0">
        <div className="flex items-center space-x-2 border-b-2 border-gray-300 pb-2">
          {data.title === "Work Experience" && (
            <Briefcase className="w-4 h-4 text-blue-600" />
          )}
          {data.title === "Projects" && (
            <Award className="w-4 h-4 text-orange-600" />
          )}
          {data.title === "Education" && (
            <GraduationCap className="w-4 h-4 text-green-600" />
          )}
          <h2 className="text-base font-semibold text-gray-900">
            {data.title}
          </h2>
        </div>
      </div>
    );
  }

  return (
    <Card className="mb-1.5 bg-white border-0 rounded-2xl shadow-none">
      <CardHeader className="pb-1.5">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {grip}
            {isEditingTitle ? (
              <div className="flex items-center space-x-2 flex-1">
                <Input
                  value={data.title || "New Section"}
                  onChange={(e) => updateField("title", e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyPress={(e) => e.key === "Enter" && handleTitleSave()}
                  className="text-base font-semibold border-none p-0 h-auto focus:ring-0"
                  autoFocus
                />
              </div>
            ) : (
              <h4
                className="text-base font-semibold cursor-pointer hover:text-blue-600"
                onClick={() => setIsEditingTitle(true)}
              >
                {data.title || "New Section"}
              </h4>
            )}
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
          <div>
            <Label>Content</Label>
            <Textarea
              value={data.content || ""}
              onChange={(e) => updateField("content", e.target.value)}
              placeholder="Add content for this section..."
              className="min-h-[120px] resize-none"
              rows={5}
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
