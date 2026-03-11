"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import type { SectionEditorProps } from "../types";

export default function SkillsSection({
  data,
  onUpdate,
  grip,
}: SectionEditorProps<string[]>) {
  const skills = data || [];
  const [newSkill, setNewSkill] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const addSkill = () => {
    if (newSkill.trim()) {
      onUpdate([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (index: number) => {
    onUpdate(skills.filter((_: string, i: number) => i !== index));
  };

  return (
    <Card className="mb-1.5 bg-white border-0 rounded-2xl shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <div className="flex items-center gap-2 min-w-0">
          {grip}
          <h3 className="text-base font-semibold">Skills</h3>
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
          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add a skill..."
              onKeyPress={(e) => e.key === "Enter" && addSkill()}
              className="flex-1"
            />
            <Button onClick={addSkill} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {skills.map((skill: string, index: number) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 text-sm py-1.5 px-3 rounded-full bg-blue-100 text-blue-800 font-medium"
              >
                {skill}
                <button
                  onClick={() => removeSkill(index)}
                  className="text-blue-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          {skills.length === 0 && (
            <p className="text-gray-500 text-sm italic">
              No skills added yet. Add your key technical and soft skills.
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
