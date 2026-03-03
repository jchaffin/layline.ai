"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import {
  LayoutGrid,
  Download,
  FileText,
  GripVertical,
  ChevronDown,
  PenLine,
  Columns2,
  Eye,
  Loader2,
  Check,
} from "lucide-react";
import DraggableResumeBuilder from "@/components/resume/DraggableResumeBuilder";
import LiveResumeEditor from "@/components/resume/LiveResumeEditor";
import TemplatePicker from "@/components/resume/TemplatePicker";

interface DocumentEditViewProps {
  document: any;
  onBack: () => void;
  onSave: (data: any) => void;
  onToggleSidebar?: () => void;
  sidebarVisible?: boolean;
}

type ViewMode = "split" | "editor" | "preview";

export default function DocumentEditView({
  document: doc,
  onBack,
  onSave,
  onToggleSidebar,
  sidebarVisible,
}: DocumentEditViewProps) {
  const [resumeData, setResumeData] = useState(doc.data);
  const [docName, setDocName] = useState(
    (doc.name || "Untitled").replace(/\.(pdf|docx?|txt|rtf)$/i, "")
  );
  const [editingName, setEditingName] = useState(false);
  const [splitPercent, setSplitPercent] = useState(50);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const savingRef = useRef(false);
  const pendingData = useRef<any>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const saveKey = doc.id
    ?.replace("original-resumes/", "parsed-resumes/")
    .replace(/\.[^.]+$/, "-parsed.json");

  const flushSave = useCallback((data: any) => {
    if (!saveKey) return;
    pendingData.current = null;
    savingRef.current = true;
    setSaveStatus("saving");
    fetch("/api/resume/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: saveKey, data }),
    })
      .catch(console.error)
      .finally(() => {
        savingRef.current = false;
        if (pendingData.current) {
          flushSave(pendingData.current);
        } else {
          setSaveStatus("saved");
          clearTimeout(savedTimer.current);
          savedTimer.current = setTimeout(() => setSaveStatus("idle"), 2000);
        }
      });
  }, [saveKey]);

  useEffect(() => () => clearTimeout(savedTimer.current), []);

  const handleDataChange = useCallback((newData: any) => {
    setResumeData(newData);
    if (savingRef.current) {
      pendingData.current = newData;
    } else {
      flushSave(newData);
    }
  }, [flushSave]);

  const handleSave = useCallback(() => {
    onSave(resumeData);
    flushSave(resumeData);
  }, [onSave, flushSave, resumeData]);

  const onDividerPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      dragging.current = true;
      const container = containerRef.current;
      if (!container) return;

      const onMove = (ev: PointerEvent) => {
        if (!dragging.current) return;
        const rect = container.getBoundingClientRect();
        const pct = ((ev.clientX - rect.left) / rect.width) * 100;

        if (pct > 92) {
          setSplitPercent(50);
          setViewMode("editor");
          dragging.current = false;
        } else if (pct < 8) {
          setSplitPercent(50);
          setViewMode("preview");
          dragging.current = false;
        } else {
          setSplitPercent(pct);
        }
      };
      const onUp = () => {
        dragging.current = false;
        window.document.removeEventListener("pointermove", onMove);
        window.document.removeEventListener("pointerup", onUp);
      };
      window.document.addEventListener("pointermove", onMove);
      window.document.addEventListener("pointerup", onUp);
    },
    [],
  );

  const viewIcons = [
    { id: "editor" as ViewMode, icon: PenLine, tip: "Edit" },
    { id: "split" as ViewMode, icon: Columns2, tip: "Split" },
    { id: "preview" as ViewMode, icon: Eye, tip: "Preview" },
  ];

  const featureTabs = [
    { id: "customize", label: "Customize" },
    { id: "ats", label: "AI Review" },
    { id: "tailor", label: "Tailor" },
  ];

  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  const centerTabs = (
    <div className="flex items-center gap-1">
      {viewIcons.map(({ id, icon: Icon, tip }) => (
        <button
          key={id}
          title={tip}
          onClick={() => { setViewMode(id); setActiveFeature(null); }}
          className={`p-2.5 rounded-lg transition-all ${
            viewMode === id && !activeFeature
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
        >
          <Icon className="w-5 h-5" />
        </button>
      ))}
      <div className="w-px h-6 bg-border mx-3" />
      {featureTabs.map((ft) => (
        <button
          key={ft.id}
          onClick={() => setActiveFeature(activeFeature === ft.id ? null : ft.id)}
          className={`px-4 py-2 rounded-lg text-sm transition-all ${
            activeFeature === ft.id
              ? "bg-secondary text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
        >
          {ft.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className={`fixed top-0 right-0 bottom-0 z-40 bg-muted flex flex-col transition-[left] duration-200 ${sidebarVisible ? "lg:left-56" : "left-0"}`}>
      <div className="bg-background border-b px-4 h-12 flex items-center shrink-0">
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <button onClick={() => onToggleSidebar?.()} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Show navigation">
            <LayoutGrid className="w-4 h-4" />
          </button>
          {editingName ? (
            <input
              autoFocus
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setEditingName(false);
                if (e.key === "Escape") { setDocName((doc.name || "Untitled").replace(/\.(pdf|docx?|txt|rtf)$/i, "")); setEditingName(false); }
              }}
              className="text-base font-medium bg-transparent border-b border-primary outline-none max-w-[280px] py-0"
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="text-base font-medium truncate max-w-[280px] rounded px-1.5 py-0.5 -mx-1.5 hover:bg-accent transition-colors"
              title="Click to rename"
            >
              {docName}
            </button>
          )}
          {saveStatus !== "idle" && (
            <span className="ml-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              {saveStatus === "saving" ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>
              ) : (
                <><Check className="w-3 h-3 text-green-500" /> Saved</>
              )}
            </span>
          )}
        </div>
        <div className="flex-1 flex justify-center">
          {centerTabs}
        </div>
        <div className="shrink-0">
          <button
            onClick={() => {
              handleSave();
              window.open(
                `/api/resume/download?key=${encodeURIComponent(doc.id)}&style=${selectedTemplate}`,
                "_blank",
              );
            }}
            className="h-8 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Download
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div ref={containerRef} className="flex flex-1 min-h-0">
        {activeFeature === "customize" ? (
          <div className="flex-1">
            <TemplatePicker
              selectedTemplate={selectedTemplate}
              onSelect={setSelectedTemplate}
            />
          </div>
        ) : (
          <>
            {/* Editor pane */}
            {(viewMode === "split" || viewMode === "editor") && (
              <div
                style={
                  viewMode === "split" ? { width: `${splitPercent}%` } : undefined
                }
                className={`overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${viewMode === "editor" ? "flex-1" : ""}`}
              >
                <DraggableResumeBuilder
                  resumeData={resumeData}
                  onDataChange={handleDataChange}
                  onSave={handleSave}
                />
              </div>
            )}

            {/* Draggable divider (split mode only) */}
            {viewMode === "split" && (
              <div
                onPointerDown={onDividerPointerDown}
                className="w-2 shrink-0 cursor-col-resize bg-border hover:bg-primary/30 active:bg-primary/40 transition-colors flex items-center justify-center select-none"
              >
                <GripVertical className="w-3 h-3 text-muted-foreground pointer-events-none" />
              </div>
            )}

            {/* Preview pane — inline editable resume */}
            {(viewMode === "split" || viewMode === "preview") && (
              <div
                style={
                  viewMode === "split"
                    ? { width: `${100 - splitPercent}%` }
                    : undefined
                }
                className={`overflow-auto ${viewMode === "preview" ? "flex-1" : ""}`}
              >
                {resumeData ? (
                  <LiveResumeEditor
                    resumeData={resumeData}
                    onDataChange={handleDataChange}
                    onAutoSave={undefined}
                    templateId={selectedTemplate}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-muted">
                    <div className="text-center">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="font-medium">No Preview Available</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Fill out the form to see preview
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
