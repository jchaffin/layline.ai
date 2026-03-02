"use client";

import { TEMPLATES, type ResumeTemplate } from "@/lib/resumeTemplates";
import { FileText } from "lucide-react";

interface TemplatePickerProps {
  selectedTemplate: string;
  onSelect: (templateId: string) => void;
}

export default function TemplatePicker({
  selectedTemplate,
  onSelect,
}: TemplatePickerProps) {
  return (
    <div className="h-full overflow-y-auto bg-[hsl(220,33%,93%)] p-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {TEMPLATES.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isActive={selectedTemplate === template.id}
              onSelect={() => onSelect(template.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TemplateCard({
  template,
  isActive,
  onSelect,
}: {
  template: ResumeTemplate;
  isActive: boolean;
  onSelect: () => void;
}) {
  const layoutLabel =
    template.layout === "two-column"
      ? "Two column"
      : template.layout === "sidebar-left"
        ? "With sidebar"
        : "Single column";

  return (
    <button
      onClick={onSelect}
      className={`group text-left rounded-xl overflow-hidden bg-white transition-all ${
        isActive
          ? "ring-2 ring-primary shadow-lg"
          : "hover:shadow-md hover:ring-1 hover:ring-primary/30"
      }`}
    >
      {/* Mini preview */}
      <div className="aspect-[3/4] bg-white relative overflow-hidden border-b">
        <MiniPreview template={template} />
        {isActive && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-medium">{template.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{layoutLabel}</p>
      </div>
    </button>
  );
}

function MiniPreview({ template }: { template: ResumeTemplate }) {
  const isTwoCol = template.layout === "two-column" || template.layout === "sidebar-left";
  const hasColoredHeader = ["traditional", "prime-ats"].includes(template.id);
  const hasDarkSidebar = ["professional", "clean"].includes(template.id);
  const accentColor = template.id === "prime-ats" ? "#dc2626" : template.id === "traditional" ? "#1a365d" : "#2563eb";

  return (
    <div className="w-full h-full p-3 flex flex-col" style={{ fontSize: 4 }}>
      {hasColoredHeader && (
        <div className="rounded-sm mb-2 px-2 py-1.5" style={{ background: accentColor }}>
          <div className="h-2 w-12 rounded-sm bg-white/90 mb-0.5" />
          <div className="h-1 w-8 rounded-sm bg-white/50" />
        </div>
      )}

      <div className={`flex-1 flex ${isTwoCol ? "gap-2" : ""}`} style={{ flexDirection: template.layout === "sidebar-left" ? "row-reverse" : "row" }}>
        {/* Main content */}
        <div className={isTwoCol ? "flex-[7]" : "flex-1"}>
          {!hasColoredHeader && (
            <div className="mb-2">
              <div className="h-2 w-16 rounded-sm mb-0.5" style={{ background: "#1e293b" }} />
              <div className="h-1 w-10 rounded-sm" style={{ background: "#94a3b8" }} />
              <div className="h-px w-full mt-1" style={{ background: accentColor }} />
            </div>
          )}
          {/* Summary lines */}
          <div className="space-y-0.5 mb-2">
            <div className="h-0.5 w-full rounded-sm bg-gray-200" />
            <div className="h-0.5 w-11/12 rounded-sm bg-gray-200" />
            <div className="h-0.5 w-10/12 rounded-sm bg-gray-200" />
          </div>
          {/* Experience block */}
          <div className="h-1 w-12 rounded-sm bg-gray-300 mb-1" />
          <div className="space-y-0.5 mb-1.5">
            <div className="h-0.5 w-full rounded-sm bg-gray-200" />
            <div className="h-0.5 w-11/12 rounded-sm bg-gray-200" />
          </div>
          <div className="space-y-0.5">
            <div className="h-0.5 w-full rounded-sm bg-gray-200" />
            <div className="h-0.5 w-10/12 rounded-sm bg-gray-200" />
          </div>
        </div>

        {/* Sidebar */}
        {isTwoCol && (
          <div
            className={`flex-[3] rounded-sm p-1 ${hasDarkSidebar ? "" : ""}`}
            style={{ background: hasDarkSidebar ? "#1e293b" : "#f1f5f9" }}
          >
            <div className="h-1 w-8 rounded-sm mb-1" style={{ background: hasDarkSidebar ? "#93c5fd" : "#94a3b8" }} />
            <div className="space-y-0.5">
              <div className="h-0.5 w-full rounded-sm" style={{ background: hasDarkSidebar ? "rgba(255,255,255,0.2)" : "#d1d5db" }} />
              <div className="h-0.5 w-10/12 rounded-sm" style={{ background: hasDarkSidebar ? "rgba(255,255,255,0.2)" : "#d1d5db" }} />
              <div className="h-0.5 w-8/12 rounded-sm" style={{ background: hasDarkSidebar ? "rgba(255,255,255,0.2)" : "#d1d5db" }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
