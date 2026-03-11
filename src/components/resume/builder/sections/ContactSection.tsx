"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { GooglePlacesAutocomplete } from "@/components/shared/AutoComplete";
import type { SectionEditorProps } from "../types";

export default function ContactSection({
  data,
  onUpdate,
  grip,
}: SectionEditorProps) {
  const contact = data || {};
  const [isCollapsed, setIsCollapsed] = useState(false);

  const updateField = (field: string, value: any) => {
    onUpdate({ ...contact, [field]: value });
  };

  return (
    <Card className="mb-1.5 bg-white border-0 rounded-2xl shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <div className="flex items-center gap-2 min-w-0">
          {grip}
          <h3 className="text-base font-semibold">Contact Information</h3>
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
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={contact.name || ""}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div>
              <Label>Job Title</Label>
              <Input
                value={contact.title || ""}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g. Senior Software Engineer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={contact.email || ""}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="your.email@example.com"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={contact.phone || ""}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div>
            <Label>Location</Label>
            <GooglePlacesAutocomplete
              value={contact.location || ""}
              onChange={(value) => updateField("location", value)}
              placeholder="City, State or Country"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label>Website URL</Label>
              <Input
                type="url"
                value={contact.website || ""}
                onChange={(e) => updateField("website", e.target.value)}
                placeholder="https://yourwebsite.com"
              />
            </div>
            <div>
              <Label>LinkedIn</Label>
              <Input
                value={contact.linkedin || ""}
                onChange={(e) => updateField("linkedin", e.target.value)}
                placeholder="linkedin.com/in/username"
              />
            </div>
            <div>
              <Label>GitHub</Label>
              <Input
                value={contact.github || ""}
                onChange={(e) => updateField("github", e.target.value)}
                placeholder="github.com/username"
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
