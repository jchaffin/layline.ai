"use client";

import React, { useCallback, useRef, useEffect, useLayoutEffect, useState } from "react";
import { MapPin, Phone, Mail, Linkedin, Github, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import {
  RESUME_CSS,
  getFullName,
  formatDate,
  type ResumeData,
  type ResumeExperience,
  type ResumeEducation,
} from "@/lib/resumeTemplate";
import { getTemplateCSS } from "@/lib/resumeTemplates";

function stripBlockTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/?(div|p|ul|ol|li)[^>]*>/gi, "");
}

function htmlToPlainText(html: string): string {
  return stripBlockTags(html)
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/\u00a0/g, " ")
    .trim();
}

function parseBullets(desc: string): string[] {
  if (!desc || !desc.trim()) return [];
  const isHtml = /<[a-z][\s\S]*>/i.test(desc);
  if (isHtml) {
    const liMatches = desc.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
    const liBullets = liMatches
      ? liMatches.map((li) => li.replace(/<\/?li[^>]*>/gi, "").replace(/<br\s*\/?>/gi, " ").trim()).filter(Boolean)
      : [];
    const remaining = desc.replace(/<ul[^>]*>[\s\S]*?<\/ul>/gi, "").replace(/<ol[^>]*>[\s\S]*?<\/ol>/gi, "");
    const divBullets = stripBlockTags(remaining)
      .split("\n")
      .map((l) => l.replace(/^\s*(?:•|-)\s*/, "").trim())
      .filter(Boolean);
    const all = [...liBullets, ...divBullets];
    return all.length > 0 ? all : [stripBlockTags(desc).trim()].filter(Boolean);
  }
  return desc
    .split(/(?:^|\n)\s*(?:•|-)\s*/)
    .filter(Boolean)
    .map((l) => l.trim());
}

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
  style,
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  tag?: "div" | "span";
  placeholder?: string;
  multiline?: boolean;
  style?: React.CSSProperties;
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
    const text = multiline
      ? (ref.current?.innerText || "")
      : (ref.current?.textContent || "");
    if (text !== lastValue.current) {
      lastValue.current = text;
      onChange(text);
    }
  }, [multiline, onChange]);

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
      style={style}
      data-placeholder={placeholder}
      spellCheck
    />
  );
}

const PAGE_H_DEFAULT = 11 * 96;
const EDITOR_TOP_BAR_H = 48;
const PAGE_CANVAS_PADDING = 24;
const PAGE_TOP_CANVAS_PADDING = 40;
const PAGE_BREAK_BOTTOM_MARGIN = 24;
const PAGE_BREAK_TOP_MARGIN = 24;

export default function LiveResumeEditor({
  resumeData,
  onDataChange,
  onAutoSave,
  templateId = "modern",
}: LiveResumeEditorProps) {
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pageRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageHeight, setPageHeight] = useState(PAGE_H_DEFAULT);
  const data = resumeData;
  const dataRef = useRef(data);
  dataRef.current = data;

  useLayoutEffect(() => {
    const el = pageRef.current;
    const viewport = viewportRef.current;
    if (!el) return;

    const PAGE_H = PAGE_H_DEFAULT;
    setPageHeight(PAGE_H);

    // Reset previous page-break margins
    el.querySelectorAll<HTMLElement>("[data-pb]").forEach((child) => {
      child.style.marginTop = "";
      child.removeAttribute("data-pb");
    });

    // Push items only when they straddle a page boundary and the push is small
    // (avoid creating giant gaps — skip if push would be > 200px)
    const items = el.querySelectorAll<HTMLElement>(
      ".resume-exp-item, .resume-edu-item"
    );

    for (const item of items) {
      const top = item.offsetTop;
      const bottom = top + item.offsetHeight;
      const pageEnd = (Math.floor(top / PAGE_H) + 1) * PAGE_H;
      const breakThreshold = pageEnd - PAGE_BREAK_BOTTOM_MARGIN;
      const nextPageStart = pageEnd + PAGE_BREAK_TOP_MARGIN;
      const push = nextPageStart - top;

      // Keep content away from the break line so each page gets breathing room.
      if (
        top < breakThreshold &&
        bottom > breakThreshold &&
        item.offsetHeight < PAGE_H - PAGE_BREAK_TOP_MARGIN &&
        push < 260
      ) {
        item.style.marginTop = `${push}px`;
        item.setAttribute("data-pb", "1");
      }
    }

    // Push bullet points that cross a page boundary so the entire bullet
    // moves to the next page instead of splitting across pages.
    const bullets = el.querySelectorAll<HTMLElement>(".resume-bullet-item");
    for (const bullet of bullets) {
      const top = bullet.offsetTop;
      const bottom = top + bullet.offsetHeight;
      const pageEnd = (Math.floor(top / PAGE_H) + 1) * PAGE_H;
      const nextPageStart = pageEnd + PAGE_BREAK_TOP_MARGIN;
      const push = nextPageStart - top;

      if (
        top < pageEnd &&
        bottom > pageEnd &&
        bullet.offsetHeight < PAGE_H - PAGE_BREAK_TOP_MARGIN &&
        push < 320
      ) {
        bullet.style.marginTop = `${push}px`;
        bullet.setAttribute("data-pb", "1");
      }
    }

    setTotalPages(Math.max(1, Math.ceil(el.scrollHeight / PAGE_H)));
  }, [resumeData, templateId]);

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

  const updateJobTitle = useCallback(
    (val: string) => {
      const nextValue = val || undefined;
      update({
        jobTitle: nextValue,
        contact: {
          ...dataRef.current.contact,
          title: nextValue,
        },
      });
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

  const updateProject = useCallback(
    (index: number, patch: Partial<ResumeExperience>) => {
      const projects = [...(dataRef.current.projects || [])];
      projects[index] = { ...projects[index], ...patch };
      update({ projects });
    },
    [update],
  );

  const updateDescriptionBullet = useCallback(
    (
      type: "experience" | "project",
      itemIndex: number,
      bulletIndex: number,
      val: string,
    ) => {
      const currentItems =
        type === "experience"
          ? [...(dataRef.current.experience || [])]
          : [...(dataRef.current.projects || [])];
      const currentItem = currentItems[itemIndex];
      if (!currentItem) return;

      const bullets = parseBullets(currentItem.description || "").map((line) =>
        htmlToPlainText(line),
      );
      if (bulletIndex >= bullets.length) return;

      if (val.trim()) {
        bullets[bulletIndex] = val.trim();
      } else {
        bullets.splice(bulletIndex, 1);
      }

      const description = bullets.map((line) => `- ${line}`).join("\n");
      currentItems[itemIndex] = { ...currentItem, description };

      if (type === "experience") {
        update({ experience: currentItems });
      } else {
        update({ projects: currentItems });
      }
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

  return (
    <div className="group relative flex-1 min-h-0 flex flex-col">
      <style dangerouslySetInnerHTML={{ __html: getTemplateCSS(templateId) }} />

      <div
        ref={viewportRef}
        className="flex-1 min-h-0 overflow-hidden relative"
        style={{
          paddingTop: `${EDITOR_TOP_BAR_H + PAGE_TOP_CANVAS_PADDING}px`,
          paddingRight: `${PAGE_CANVAS_PADDING}px`,
          paddingBottom: `${PAGE_CANVAS_PADDING}px`,
          paddingLeft: `${PAGE_CANVAS_PADDING}px`,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: `-${(currentPage - 1) * pageHeight}px`,
            left: 0,
            right: 0,
          }}
        >
          <div className="mx-auto" style={{ width: "8.5in" }}>
            <div
              ref={pageRef}
              className="resume-page bg-white relative"
              style={{ width: "8.5in", minHeight: `${PAGE_H_DEFAULT}px`, boxSizing: "border-box" }}
            >
            {/* Left column */}
            <div className="resume-left">
              <div className="resume-header">
                <EditableField
                  value={getFullName(c)}
                  onChange={(val) => updateContact("name", val)}
                  className="resume-name"
                  placeholder="Your Name"
                />
                {(data.jobTitle !== undefined || c.title !== undefined) && (
                  <EditableField
                    value={data.jobTitle || c.title || ""}
                    onChange={updateJobTitle}
                    className="resume-title"
                    placeholder="Job Title (optional)"
                  />
                )}
              </div>

              <div className="resume-section">
                <div className="resume-section-title">Professional Summary</div>
                <EditableField
                  value={htmlToPlainText(data.summary || "")}
                  onChange={(val) => update({ summary: val })}
                  multiline
                  className="resume-summary"
                  placeholder="Write a professional summary"
                  style={{ whiteSpace: "pre-wrap" } as any}
                />
              </div>

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
                        <span className="resume-exp-duration" style={{ display: "flex", gap: 4 }}>
                          <EditableField
                            value={formatDate(exp.startDate)}
                            onChange={(val) => {
                              const d = new Date(val);
                              if (!isNaN(d.getTime())) updateExperience(i, { startDate: d.toISOString() });
                            }}
                            tag="span"
                            placeholder="Start"
                          />
                          <span>—</span>
                          <EditableField
                            value={exp.isCurrentRole ? "Present" : formatDate(exp.endDate)}
                            onChange={(val) => {
                              if (val.toLowerCase() === "present") {
                                updateExperience(i, { isCurrentRole: true, endDate: undefined });
                              } else {
                                const d = new Date(val);
                                if (!isNaN(d.getTime())) updateExperience(i, { endDate: d.toISOString(), isCurrentRole: false });
                              }
                            }}
                            tag="span"
                            placeholder="End"
                          />
                        </span>
                      </div>
                      <EditableField
                        value={exp.company}
                        onChange={(val) => updateExperience(i, { company: val })}
                        className="resume-exp-company"
                        placeholder="Company Name"
                      />
                      <div className="resume-exp-desc">
                        {parseBullets(exp.description || "").map((line, li) => (
                          <div key={li} className="resume-bullet-item">
                            <span className="resume-bullet">•</span>
                            <EditableField
                              value={htmlToPlainText(line)}
                              onChange={(val) =>
                                updateDescriptionBullet("experience", i, li, val)
                              }
                              tag="span"
                              className="flex-1"
                              placeholder="Bullet point"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {data.projects && data.projects.length > 0 && (
                <div className="resume-section">
                  <div className="resume-section-title">Projects</div>
                  {data.projects.map((project, i) => (
                    <div key={i} className="resume-project-item resume-exp-item">
                      <div className="resume-exp-header">
                        <EditableField
                          value={project.company || ""}
                          onChange={(val) => updateProject(i, { company: val })}
                          className="resume-exp-role"
                          placeholder="Project Name"
                        />
                        {(project.startDate || project.endDate || project.isCurrentRole) && (
                          <span className="resume-exp-duration" style={{ display: "flex", gap: 4 }}>
                            <EditableField
                              value={formatDate(project.startDate)}
                              onChange={(val) => {
                                const d = new Date(val);
                                if (!isNaN(d.getTime())) updateProject(i, { startDate: d.toISOString() });
                              }}
                              tag="span"
                              placeholder="Start"
                            />
                            <span>—</span>
                            <EditableField
                              value={project.isCurrentRole ? "Present" : formatDate(project.endDate)}
                              onChange={(val) => {
                                if (val.toLowerCase() === "present") {
                                  updateProject(i, { isCurrentRole: true, endDate: undefined });
                                } else {
                                  const d = new Date(val);
                                  if (!isNaN(d.getTime())) updateProject(i, { endDate: d.toISOString(), isCurrentRole: false });
                                }
                              }}
                              tag="span"
                              placeholder="End"
                            />
                          </span>
                        )}
                      </div>
                      {project.role !== undefined && (
                        <EditableField
                          value={project.role || ""}
                          onChange={(val) => updateProject(i, { role: val })}
                          className="resume-exp-company"
                          placeholder=""
                        />
                      )}
                      <div className="resume-exp-desc">
                        {parseBullets(project.description || "").map((line, li) => (
                          <div key={li} className="resume-bullet-item">
                            <span className="resume-bullet">•</span>
                            <EditableField
                              value={htmlToPlainText(line)}
                              onChange={(val) =>
                                updateDescriptionBullet("project", i, li, val)
                              }
                              tag="span"
                              className="flex-1"
                              placeholder="Bullet point"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {data.education && data.education.length > 0 && (
                <div className="resume-section">
                  <div className="resume-section-title">Education</div>
                  {data.education.map((edu, i) => (
                    <div key={i} className="resume-edu-item">
                      <div className="resume-edu-header">
                        <EditableField
                          value={edu.degree + (edu.field ? ` in ${edu.field}` : "")}
                          onChange={(val) => {
                            const match = val.match(/^(.+?)\s+in\s+(.+)$/);
                            if (match) {
                              updateEducation(i, { degree: match[1], field: match[2] });
                            } else {
                              updateEducation(i, { degree: val, field: undefined });
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
                        onChange={(val) => updateEducation(i, { institution: val })}
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
                    <EditableField value={c.location || ""} onChange={(val) => updateContact("location", val)} tag="span" placeholder="Location" />
                  </div>
                )}
                {c.phone !== undefined && (
                  <div className="resume-detail" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Phone style={{ width: 12, height: 12, flexShrink: 0, color: "#2563eb" }} />
                    <EditableField value={c.phone || ""} onChange={(val) => updateContact("phone", val)} tag="span" placeholder="Phone" />
                  </div>
                )}
                {c.email !== undefined && (
                  <div className="resume-detail" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Mail style={{ width: 12, height: 12, flexShrink: 0, color: "#2563eb" }} />
                    <EditableField value={c.email || ""} onChange={(val) => updateContact("email", val)} tag="span" placeholder="Email" />
                  </div>
                )}
                <div className="resume-detail" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Globe style={{ width: 12, height: 12, flexShrink: 0, color: "#2563eb" }} />
                  <EditableField value={c.website || ""} onChange={(val) => updateContact("website", val)} tag="span" placeholder="Website URL" />
                </div>
              </div>

              <div className="resume-sidebar-section">
                <div className="resume-sidebar-title">Links</div>
                <div className="resume-link" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Linkedin style={{ width: 12, height: 12, flexShrink: 0 }} />
                  <EditableField value={c.linkedin || ""} onChange={(val) => updateContact("linkedin", val)} tag="span" placeholder="LinkedIn URL" />
                </div>
                <div className="resume-link" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Github style={{ width: 12, height: 12, flexShrink: 0 }} />
                  <EditableField value={c.github || ""} onChange={(val) => updateContact("github", val)} tag="span" placeholder="GitHub URL" />
                </div>
                <div className="resume-link" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Globe style={{ width: 12, height: 12, flexShrink: 0 }} />
                  <EditableField value={c.website || ""} onChange={(val) => updateContact("website", val)} tag="span" placeholder="Website URL" />
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
                        if (val.trim()) { next[i] = val; } else { next.splice(i, 1); }
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
        </div>
      </div>

      {totalPages > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/70 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-0.5 rounded-full hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="tabular-nums select-none">{currentPage} / {totalPages}</span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-0.5 rounded-full hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
