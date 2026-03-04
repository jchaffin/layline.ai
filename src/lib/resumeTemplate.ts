export interface ResumeContact {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface ResumeExperience {
  company: string;
  role: string;
  startDate?: string;
  endDate?: string;
  isCurrentRole?: boolean;
  location?: string;
  description?: string;
  achievements?: string[];
  responsibilities?: string[];
  keywords?: string[];
}

export interface ResumeEducation {
  institution: string;
  degree: string;
  field?: string;
  year: string;
  gpa?: string;
  honors?: string;
}

export interface ResumeData {
  summary?: string;
  skills?: string[];
  jobTitle?: string;
  experience?: ResumeExperience[];
  education?: ResumeEducation[];
  contact?: ResumeContact;
  ats_score?: string;
  ats_recommendations?: string[];
}

export function getFullName(contact?: ResumeContact): string {
  if (!contact) return "Your Name";
  if (contact.name) return contact.name;
  if (contact.firstName || contact.lastName) {
    return `${contact.firstName || ""} ${contact.lastName || ""}`.trim();
  }
  return "Your Name";
}

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return `${date.getMonth() + 1}/${date.getFullYear()}`;
}

/** Print/PDF: avoid breaking sections across pages */
export const RESUME_PRINT_PAGE_BREAK_CSS = `
  @media print {
    .resume-page .resume-header,
    .resume-page .resume-section,
    .resume-page .resume-exp-item,
    .resume-page .resume-edu-item,
    .resume-page .resume-sidebar-section {
      page-break-inside: avoid;
    }
    @page { size: A4; margin: 0; }
  }
`;

export const RESUME_CSS = `
  .resume-page *, .resume-page *::before, .resume-page *::after {
    margin: 0; padding: 0; box-sizing: border-box;
  }

  .resume-page {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 10px;
    line-height: 1.4;
    color: #333;
    background: white;
    width: 100%;
    min-height: 11in;
    padding: 0.5in 0.6in 0.5in 0.6in;
    display: flex;
    gap: 0.5in;
  }

  .resume-left { flex: 7; }

  .resume-right {
    flex: 3;
    background: #f8f9fa;
    padding: 0.2in;
    margin-top: 0.8in;
    border-radius: 8px;
    height: fit-content;
  }

  .resume-header {
    margin-bottom: 0.3in;
    border-bottom: 3px solid #2563eb;
    padding-bottom: 0.1in;
  }

  .resume-name {
    font-size: 28px;
    font-weight: bold;
    color: #1e293b;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .resume-title {
    font-size: 14px;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .resume-section { margin-bottom: 0.2in; }

  .resume-section-title {
    font-size: 14px;
    font-weight: bold;
    color: #1e293b;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 4px;
  }

  .resume-summary {
    font-size: 11px;
    line-height: 1.6;
    color: #374151;
  }

  .resume-exp-item { margin-bottom: 14px; }

  .resume-exp-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 4px;
  }

  .resume-exp-role {
    font-size: 13px;
    font-weight: bold;
    color: #1e293b;
  }

  .resume-exp-company {
    font-size: 11px;
    font-weight: 600;
    color: #2563eb;
    margin-bottom: 4px;
  }

  .resume-exp-duration {
    font-size: 10px;
    color: #64748b;
    font-style: italic;
    white-space: nowrap;
  }

  .resume-exp-desc {
    font-size: 10px;
    line-height: 1.5;
    color: #374151;
  }

  .resume-bullet-item {
    font-size: 10px;
    line-height: 1.4;
    color: #374151;
    margin-bottom: 3px;
    display: flex;
  }

  .resume-bullet {
    font-size: 8px;
    color: #2563eb;
    margin-right: 6px;
    margin-top: 2px;
    font-weight: bold;
    flex-shrink: 0;
  }

  .resume-sidebar-title {
    font-size: 13px;
    font-weight: bold;
    margin-bottom: 8px;
    color: #1e293b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .resume-sidebar-section { margin-bottom: 20px; }

  .resume-detail {
    font-size: 10px;
    color: #374151;
    margin-bottom: 5px;
  }

  .resume-link {
    font-size: 10px;
    color: #2563eb;
    margin-bottom: 5px;
    text-decoration: none;
  }

  .resume-skill {
    font-size: 9px;
    color: #374151;
    margin-bottom: 2px;
  }

  .resume-edu-item { margin-bottom: 10px; }

  .resume-edu-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2px;
  }

  .resume-edu-degree {
    font-size: 11px;
    font-weight: bold;
    color: #1e293b;
  }

  .resume-edu-institution {
    font-size: 10px;
    color: #2563eb;
    font-weight: 600;
  }

  .resume-edu-year {
    font-size: 9px;
    color: #64748b;
    font-style: italic;
  }

  [contenteditable]:hover {
    outline: 1px dashed #93c5fd;
    outline-offset: 2px;
    border-radius: 2px;
  }

  [contenteditable]:focus {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
    border-radius: 2px;
  }

  [contenteditable] { cursor: text; }

  [contenteditable]:empty::before {
    content: attr(data-placeholder);
    color: #9ca3af;
    font-style: italic;
  }
`;

export function generateResumeHTMLString(data: ResumeData): string {
  const name = getFullName(data.contact);
  const c = data.contact || {};

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Resume</title>
<style>${RESUME_CSS} .resume-page { width: 8.5in; }</style>
</head><body>
<div class="resume-page">
  <div class="resume-left">
    <div class="resume-header">
      <div class="resume-name">${name}</div>
      ${data.jobTitle ? `<div class="resume-title">${data.jobTitle}</div>` : ""}
    </div>
    ${data.summary ? `<div class="resume-section"><div class="resume-section-title">Professional Summary</div><div class="resume-summary">${data.summary}</div></div>` : ""}
    ${data.experience?.length ? `<div class="resume-section"><div class="resume-section-title">Professional Experience</div>${data.experience.map((exp) => `
      <div class="resume-exp-item">
        <div class="resume-exp-header">
          <div class="resume-exp-role">${exp.role}</div>
          <div class="resume-exp-duration">${formatDate(exp.startDate)} — ${exp.isCurrentRole ? "Present" : formatDate(exp.endDate)}</div>
        </div>
        <div class="resume-exp-company">${exp.company}</div>
        ${exp.description ? `<div class="resume-exp-desc">${exp.description.split("\\n").map((line) => { const t = line.trim(); return t.startsWith("- ") ? `<div class="resume-bullet-item"><span class="resume-bullet">•</span><span>${t.substring(2)}</span></div>` : t ? `<div>${t}</div>` : ""; }).join("")}</div>` : ""}
      </div>`).join("")}</div>` : ""}
    ${data.education?.length ? `<div class="resume-section"><div class="resume-section-title">Education</div>${data.education.map((edu) => `
      <div class="resume-edu-item">
        <div class="resume-edu-header">
          <div class="resume-edu-degree">${edu.degree}${edu.field ? ` in ${edu.field}` : ""}</div>
          <div class="resume-edu-year">${edu.year}</div>
        </div>
        <div class="resume-edu-institution">${edu.institution}</div>
      </div>`).join("")}</div>` : ""}
  </div>
  <div class="resume-right">
    <div class="resume-sidebar-section">
      <div class="resume-sidebar-title">Contact</div>
      ${c.location ? `<div class="resume-detail" style="display:flex;align-items:center;gap:6px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>${c.location}</div>` : ""}
      ${c.phone ? `<div class="resume-detail" style="display:flex;align-items:center;gap:6px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>${c.phone}</div>` : ""}
      ${c.email ? `<div class="resume-detail" style="display:flex;align-items:center;gap:6px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>${c.email}</div>` : ""}
    </div>
    ${c.linkedin || c.github || c.website ? `<div class="resume-sidebar-section">
      <div class="resume-sidebar-title">Links</div>
      ${c.linkedin ? `<div class="resume-link" style="display:flex;align-items:center;gap:6px"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>${c.linkedin}</div>` : ""}
      ${c.github ? `<div class="resume-link" style="display:flex;align-items:center;gap:6px"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>${c.github}</div>` : ""}
      ${c.website ? `<div class="resume-link" style="display:flex;align-items:center;gap:6px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>${c.website}</div>` : ""}
    </div>` : ""}
    ${data.skills?.length ? `<div class="resume-sidebar-section">
      <div class="resume-sidebar-title">Skills</div>
      ${data.skills.map((s) => `<div class="resume-skill">• ${s}</div>`).join("")}
    </div>` : ""}
  </div>
</div>
</body></html>`;
}
