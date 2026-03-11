"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import type { DeletableSectionEditorProps } from "../types";

export default function EducationItem({
  data: education,
  onUpdate,
  onDelete,
  grip,
}: DeletableSectionEditorProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const updateField = (field: string, value: any) => {
    onUpdate({ ...education, [field]: value });
  };

  return (
    <Card className="mb-1.5 bg-white border-0 rounded-2xl shadow-none">
      <CardHeader className="pb-1.5">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {grip}
            <h4 className="text-lg font-semibold">
              {education.degree || "New Education"}
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
              <Label>Institution</Label>
              <Input
                value={education.institution || ""}
                onChange={(e) => updateField("institution", e.target.value)}
                placeholder="University or School name"
              />
            </div>
            <div>
              <Label>Year</Label>
              <Input
                value={education.year || ""}
                onChange={(e) => updateField("year", e.target.value)}
                placeholder="2024"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label>Degree</Label>
              <div className="relative">
                <Input
                  value={education.degree || ""}
                  onChange={(e) => updateField("degree", e.target.value)}
                  placeholder="Bachelor of Science"
                  list="degree-options"
                />
                <datalist id="degree-options">
                  <option value="Associate of Arts (AA)" />
                  <option value="Associate of Science (AS)" />
                  <option value="Associate of Applied Science (AAS)" />
                  <option value="Bachelor of Arts (BA)" />
                  <option value="Bachelor of Science (BS)" />
                  <option value="Bachelor of Business Administration (BBA)" />
                  <option value="Bachelor of Engineering (BE)" />
                  <option value="Bachelor of Technology (B.Tech)" />
                  <option value="Bachelor of Fine Arts (BFA)" />
                  <option value="Bachelor of Music (BM)" />
                  <option value="Bachelor of Education (B.Ed)" />
                  <option value="Master of Arts (MA)" />
                  <option value="Master of Science (MS)" />
                  <option value="Master of Business Administration (MBA)" />
                  <option value="Master of Engineering (MEng)" />
                  <option value="Master of Technology (M.Tech)" />
                  <option value="Master of Fine Arts (MFA)" />
                  <option value="Master of Education (M.Ed)" />
                  <option value="Master of Public Health (MPH)" />
                  <option value="Master of Social Work (MSW)" />
                  <option value="Juris Doctor (JD)" />
                  <option value="Doctor of Medicine (MD)" />
                  <option value="Doctor of Philosophy (PhD)" />
                  <option value="Doctor of Education (Ed.D)" />
                  <option value="Doctor of Psychology (Psy.D)" />
                  <option value="Doctor of Dental Surgery (DDS)" />
                  <option value="Doctor of Veterinary Medicine (DVM)" />
                  <option value="Certificate" />
                  <option value="Diploma" />
                  <option value="Professional Certificate" />
                  <option value="High School Diploma" />
                  <option value="GED" />
                </datalist>
              </div>
            </div>
            <div>
              <Label>Field of Study</Label>
              <Input
                value={education.field || ""}
                onChange={(e) => updateField("field", e.target.value)}
                placeholder="Computer Science"
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
