"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Award, Briefcase, GraduationCap, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import SortableItem from "./builder/SortableItem";
import {
  createSection,
  getInsertIndex,
  initializeSections,
  serializeSectionsToResumeData,
} from "./builder/model";
import type {
  DraggableResumeBuilderProps,
  ResumeSection,
} from "./builder/types";
import ATSRatingSection from "./builder/sections/ATSRatingSection";
import ContactSection from "./builder/sections/ContactSection";
import CustomSection from "./builder/sections/CustomSection";
import EducationItem from "./builder/sections/EducationItem";
import ExperienceItem from "./builder/sections/ExperienceItem";
import ProjectItem from "./builder/sections/ProjectItem";
import SkillsSection from "./builder/sections/SkillsSection";
import SummarySection from "./builder/sections/SummarySection";

export default function DraggableResumeBuilder({
  resumeData,
  onDataChange,
  onSave,
  readOnly = false,
}: DraggableResumeBuilderProps) {
  const [sections, setSections] = useState<ResumeSection[]>(() =>
    initializeSections(resumeData),
  );
  const lastPushedJson = useRef("");

  useEffect(() => {
    const incoming = JSON.stringify(resumeData);
    if (incoming !== lastPushedJson.current) {
      setSections(initializeSections(resumeData));
    }
  }, [resumeData]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateResumeData = (newSections: ResumeSection[]) => {
    const newResumeData = serializeSectionsToResumeData(resumeData, newSections);
    lastPushedJson.current = JSON.stringify(newResumeData);
    onDataChange(newResumeData);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex(section => section.id === active.id);
      const newIndex = sections.findIndex(section => section.id === over.id);
      
      const newSections = arrayMove(sections, oldIndex, newIndex);
      setSections(newSections);
      updateResumeData(newSections);
    }
  };

  const updateSection = (id: string, data: any) => {
    const newSections = sections.map(section => 
      section.id === id ? { ...section, data } : section
    );
    setSections(newSections);
    updateResumeData(newSections);
  };

  const deleteSection = (id: string) => {
    const section = sections.find((s) => s.id === id);
    if (section && ["contact", "summary", "skills"].includes(section.type)) {
      return;
    }
    const newSections = sections.filter((s) => s.id !== id);
    setSections(newSections);
    updateResumeData(newSections);
  };

  const addSection = (type: "experience" | "project" | "education") => {
    const newSection = createSection(type);
    const insertIndex = getInsertIndex(sections, type);

    const newSections = [
      ...sections.slice(0, insertIndex),
      newSection,
      ...sections.slice(insertIndex),
    ];
    setSections(newSections);
    updateResumeData(newSections);
  };

  const renderSection = (section: ResumeSection) => {
    switch (section.type) {
      case "contact":
        return (
          <ContactSection
            data={section.data}
            onUpdate={readOnly ? () => {} : (data) => updateSection(section.id, data)}
          />
        );
      case "summary":
        return (
          <SummarySection
            data={section.data}
            onUpdate={readOnly ? () => {} : (data) => updateSection(section.id, data)}
          />
        );
      case "skills":
        return (
          <SkillsSection
            data={section.data}
            onUpdate={readOnly ? () => {} : (data) => updateSection(section.id, data)}
          />
        );
      case "experience":
        return (
          <ExperienceItem
            onUpdate={readOnly ? () => {} : (data) => updateSection(section.id, data)}
            onDelete={readOnly ? () => {} : () => deleteSection(section.id)}
            data={section.data}
          />
        );
      case "project":
        return (
          <ProjectItem
            onUpdate={readOnly ? () => {} : (data) => updateSection(section.id, data)}
            onDelete={readOnly ? () => {} : () => deleteSection(section.id)}
            data={section.data}
          />
        );
      case "education":
        return (
          <EducationItem
            onUpdate={readOnly ? () => {} : (data) => updateSection(section.id, data)}
            onDelete={readOnly ? () => {} : () => deleteSection(section.id)}
            data={section.data}
          />
        );
      case "custom":
        return (
          <CustomSection
            data={section.data}
            onUpdate={readOnly ? () => {} : (data) => updateSection(section.id, data)}
            onDelete={readOnly ? () => {} : () => deleteSection(section.id)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={readOnly ? "p-4" : "bg-[hsl(220,33%,93%)] p-2 pl-2"}>
      <div className="max-w-4xl ml-0 mr-auto">
        {readOnly ? (
          <div>
            {sections.map((section) => (
              <div key={section.id}>{renderSection(section)}</div>
            ))}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map((section) => section.id)}
              strategy={verticalListSortingStrategy}
            >
              {sections.map((section) => (
                <SortableItem key={section.id} id={section.id}>
                  {renderSection(section)}
                </SortableItem>
              ))}
            </SortableContext>
          </DndContext>
        )}

        {!readOnly && (
          <>
            <div className="mt-6">
              <Card className="border-dashed border-2 border-gray-300 hover:border-blue-400 transition-colors">
                <CardContent className="p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">
                      Add New Section
                    </h3>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button
                        onClick={() => addSection("experience")}
                        variant="outline"
                        size="sm"
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        <Briefcase className="w-4 h-4 mr-2" />
                        Experience
                      </Button>
                      <Button
                        onClick={() => addSection("project")}
                        variant="outline"
                        size="sm"
                        className="border-orange-200 text-orange-600 hover:bg-orange-50"
                      >
                        <Award className="w-4 h-4 mr-2" />
                        Projects
                      </Button>
                      <Button
                        onClick={() => addSection("education")}
                        variant="outline"
                        size="sm"
                        className="border-green-200 text-green-600 hover:bg-green-50"
                      >
                        <GraduationCap className="w-4 h-4 mr-2" />
                        Education
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 bg-white rounded-lg shadow-sm">
              <div className="flex justify-center">
                <Button
                  onClick={onSave}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 px-8 py-3 text-base font-semibold"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </>
        )}

        {(resumeData?.ats_score || resumeData?.ats_recommendations) && (
          <div className="mt-2">
            <ATSRatingSection
              resumeData={resumeData}
              onDataChange={onDataChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
