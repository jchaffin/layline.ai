"use client";

import React, { useCallback, useRef, useEffect, useState } from "react";
import { MapPin, Phone, Mail, Linkedin, Github, Globe, ChevronLeft, ChevronRight, X, Plus } from "lucide-react";
import {
  RESUME_CSS,
  getFullName,
  formatDate,
  type ResumeData,
  type ResumeExperience,
  type ResumeEducation,
} from "@/lib/resumeTemplate";
import { getTemplateCSS } from "@/lib/resumeTemplates";

interface LiveResumeEditorProps {
  resumeData: ResumeData;
  onDataChange: (data: ResumeData) => void;
  onAutoSave?: (data: ResumeData) => void;
  templateId?: string;
}

function EditableField({
  value,
  onChange,
  className,
  tag: Tag = "div",
  placeholder,
  multiline,
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  tag?: "div" | "span";
  placeholder?: string;
  multiline?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const lastValue = useRef(value);

  useEffect(() => {
    if (ref.current && value !== lastValue.current) {
      ref.current.textContent = value;
      lastValue.current = value;
    }
  }, [value]);

  useEffect(() => {
    if (ref.current && !ref.current.textContent) {
      ref.current.textContent = value;
    }
  }, []);

  const handleInput = useCallback(() => {
    const text = ref.current?.textContent || "";
    if (text !== lastValue.current) {
      lastValue.current = text;
      onChange(text);
    }
  }, [onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!multiline && e.key === "Enter") {
        e.preventDefault();
        ref.current?.blur();
      }
    },
    [multiline],
  );

  return (
    <Tag
      ref={ref as any}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onBlur={handleInput}
      onKeyDown={handleKeyDown}
      className={className}
      data-placeholder={placeholder}
      spellCheck
    />
  );
}

export default function LiveResumeEditor({
  resumeData,
  onDataChange,
  onAutoSave,
  templateId = "modern",
}: LiveResumeEditorProps) {
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pageRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const data = resumeData;
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const pageHeight = 11 * 96;
    const observer = new ResizeObserver(() => {
      setTotalPages(Math.max(1, Math.ceil(el.scrollHeight / pageHeight)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const update = useCallback(
    (patch: Partial<ResumeData>) => {
      const next = { ...dataRef.current, ...patch };
      onDataChange(next);
      if (onAutoSave) {
        clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = setTimeout(() => onAutoSave(next), 1000);
      }
    },
    [onDataChange, onAutoSave],
  );

  useEffect(() => {
    return () => clearTimeout(autoSaveTimer.current);
  }, []);

  const updateContact = useCallback(
    (field: string, val: string) => {
      update({ contact: { ...dataRef.current.contact, [field]: val } });
    },
    [update],
  );

  const updateExperience = useCallback(
    (index: number, patch: Partial<ResumeExperience>) => {
      const exps = [...(dataRef.current.experience || [])];
      exps[index] = { ...exps[index], ...patch };
      update({ experience: exps });
    },
    [update],
  );

  const updateEducation = useCallback(
    (index: number, patch: Partial<ResumeEducation>) => {
      const edus = [...(dataRef.current.education || [])];
      edus[index] = { ...edus[index], ...patch };
      update({ education: edus });
    },
    [update],
  );

  const c = data.contact || {};

  const pageHeight = 11 * 96;

  return (
    <div className="h-full bg-white relative">
      <style dangerouslySetInnerHTML={{ __html: getTemplateCSS(templateId) }} />
      <div className="h-full overflow-hidden">
        <div
          ref={pageRef}
          className="resume-page"
          style={{
            width: "100%",
            minHeight: `${pageHeight}px`,
            transform: `translateY(-${(currentPage - 1) * pageHeight}px)`,
            transition: "transform 0.3s ease",
          }}
        >
        {/* Left column */}
        <div className="resume-left">
          {/* Header */}
          <div className="resume-header">
            <EditableField
              value={getFullName(c)}
              onChange={(val) => updateContact("name", val)}
              className="resume-name"
              placeholder="Your Name"
            />
            {data.jobTitle !== undefined && (
              <EditableField
                value={data.jobTitle || ""}
                onChange={(val) => update({ jobTitle: val || undefined })}
                className="resume-title"
                placeholder="Job Title (optional)"
              />
            )}
          </div>

          {/* Summary */}
          <div className="resume-section">
            <div className="resume-section-title">Professional Summary</div>
            <EditableField
              value={data.summary || ""}
              onChange={(val) => update({ summary: val })}
              className="resume-summary"
              placeholder="Write a brief professional summary..."
              multiline
            />
          </div>

          {/* Experience */}
          {data.experience && data.experience.length > 0 && (
            <div className="resume-section">
              <div className="resume-section-title">Professional Experience</div>
              {data.experience.map((exp, i) => (
                <div key={i} className="resume-exp-item">
                  <div className="resume-exp-header">
                    <EditableField
                      value={exp.role}
                      onChange={(val) => updateExperience(i, { role: val })}
                      className="resume-exp-role"
                      placeholder="Job Title"
                    />
                    <span className="resume-exp-duration">
                      {formatDate(exp.startDate)} —{" "}
                      {exp.isCurrentRole
                        ? "Present"
                        : formatDate(exp.endDate)}
                    </span>
                  </div>
                  <EditableField
                    value={exp.company}
                    onChange={(val) => updateExperience(i, { company: val })}
                    className="resume-exp-company"
                    placeholder="Company Name"
                  />
                  <div className="resume-exp-desc">
                    {(exp.description || "").split(/(?:^|\n)\s*(?:•|-)\s*/).filter(Boolean).map((line, li) => (
                      <div key={li} className="resume-bullet-item">
                        <span className="resume-bullet">•</span>
                        <EditableField
                          value={line.trim()}
                          onChange={(val) => {
                            const lines = (exp.description || "").split(/(?:^|\n)\s*(?:•|-)\s*/).filter(Boolean);
                            lines[li] = val;
                            updateExperience(i, { description: lines.map(l => `- ${l.trim()}`).join("\n") });
                          }}
                          tag="span"
                          placeholder="Achievement or responsibility..."
                        />
                      </div>
                    ))}
                    {!(exp.description || "").trim() && (
                      <EditableField
                        value=""
                        onChange={(val) => updateExperience(i, { description: `- ${val}` })}
                        className="resume-bullet-item"
                        placeholder="Describe your responsibilities and achievements..."
                        multiline
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {data.education && data.education.length > 0 && (
            <div className="resume-section">
              <div className="resume-section-title">Education</div>
              {data.education.map((edu, i) => (
                <div key={i} className="resume-edu-item">
                  <div className="resume-edu-header">
                    <EditableField
                      value={
                        edu.degree +
                        (edu.field ? ` in ${edu.field}` : "")
                      }
                      onChange={(val) => {
                        const match = val.match(/^(.+?)\s+in\s+(.+)$/);
                        if (match) {
                          updateEducation(i, {
                            degree: match[1],
                            field: match[2],
                          });
                        } else {
                          updateEducation(i, {
                            degree: val,
                            field: undefined,
                          });
                        }
                      }}
                      className="resume-edu-degree"
                      placeholder="Degree"
                    />
                    <EditableField
                      value={edu.year}
                      onChange={(val) => updateEducation(i, { year: val })}
                      className="resume-edu-year"
                      placeholder="Year"
                    />
                  </div>
                  <EditableField
                    value={edu.institution}
                    onChange={(val) =>
                      updateEducation(i, { institution: val })
                    }
                    className="resume-edu-institution"
                    placeholder="Institution"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column / sidebar */}
        <div className="resume-right">
          <div className="resume-sidebar-section">
            <div className="resume-sidebar-title">Contact</div>
            {c.location !== undefined && (
              <div className="resume-detail" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin style={{ width: 12, height: 12, flexShrink: 0, color: "#2563eb" }} />
                <EditableField
                  value={c.location || ""}
                  onChange={(val) => updateContact("location", val)}
                  tag="span"
                  placeholder="Location"
                />
              </div>
            )}
            {c.phone !== undefined && (
              <div className="resume-detail" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Phone style={{ width: 12, height: 12, flexShrink: 0, color: "#2563eb" }} />
                <EditableField
                  value={c.phone || ""}
                  onChange={(val) => updateContact("phone", val)}
                  tag="span"
                  placeholder="Phone"
                />
              </div>
            )}
            {c.email !== undefined && (
              <div className="resume-detail" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Mail style={{ width: 12, height: 12, flexShrink: 0, color: "#2563eb" }} />
                <EditableField
                  value={c.email || ""}
                  onChange={(val) => updateContact("email", val)}
                  tag="span"
                  placeholder="Email"
                />
              </div>
            )}
          </div>

          <div className="resume-sidebar-section">
            <div className="resume-sidebar-title">Links</div>
            <div className="resume-link" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Linkedin style={{ width: 12, height: 12, flexShrink: 0 }} />
              <EditableField
                value={c.linkedin || ""}
                onChange={(val) => updateContact("linkedin", val)}
                tag="span"
                placeholder="LinkedIn URL"
              />
            </div>
            <div className="resume-link" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Github style={{ width: 12, height: 12, flexShrink: 0 }} />
              <EditableField
                value={c.github || ""}
                onChange={(val) => updateContact("github", val)}
                tag="span"
                placeholder="GitHub URL"
              />
            </div>
            <div className="resume-link" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Globe style={{ width: 12, height: 12, flexShrink: 0 }} />
              <EditableField
                value={c.website || ""}
                onChange={(val) => updateContact("website", val)}
                tag="span"
                placeholder="Website URL"
              />
            </div>
          </div>

          {data.skills && data.skills.length > 0 && (
            <div className="resume-sidebar-section">
              <div className="resume-sidebar-title">Skills</div>
              {data.skills.map((skill, i) => (
                <EditableField
                  key={i}
                  value={skill}
                  onChange={(val) => {
                    const next = [...(dataRef.current.skills || [])];
                    if (val.trim()) {
                      next[i] = val;
                    } else {
                      next.splice(i, 1);
                    }
                    update({ skills: next });
                  }}
                  className="resume-skill"
                  placeholder="Skill"
                />
              ))}
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Page turner */}
      {totalPages > 1 && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-0.5 bg-[#1e293b] rounded-full px-1.5 py-1 shadow-lg">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="p-1 rounded-full text-white/70 hover:text-white disabled:text-white/30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-white text-sm font-medium px-2 min-w-[3rem] text-center tabular-nums">
            {currentPage}/{totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="p-1 rounded-full text-white/70 hover:text-white disabled:text-white/30 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>}
    </div>
  );
}
