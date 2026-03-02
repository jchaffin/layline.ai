export type {
  ResumeContact,
  ResumeExperience,
  ResumeEducation,
  ResumeData,
} from "./resumeTemplate";

export {
  getFullName,
  formatDate,
  generateResumeHTMLString,
} from "./resumeTemplate";

export { RESUME_CSS } from "./resumeTemplate";

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  css: string;
  layout: "two-column" | "single-column" | "sidebar-left";
}

const EDITABLE_CSS = `
  [contenteditable]:hover { outline: 1px dashed #93c5fd; outline-offset: 2px; border-radius: 2px; }
  [contenteditable]:focus { outline: 2px solid #2563eb; outline-offset: 2px; border-radius: 2px; }
  [contenteditable] { cursor: text; }
  [contenteditable]:empty::before { content: attr(data-placeholder); color: #9ca3af; font-style: italic; }
`;

const BASE_RESET = `
  .resume-page *, .resume-page *::before, .resume-page *::after { margin: 0; padding: 0; box-sizing: border-box; }
`;

export const TEMPLATES: ResumeTemplate[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Two-column with blue accents and sidebar",
    layout: "two-column",
    css: `${BASE_RESET}
      .resume-page { font-family: 'Inter', -apple-system, sans-serif; font-size: 10px; line-height: 1.4; color: #333; background: white; width: 100%; min-height: 11in; padding: 0.5in 0.6in; display: flex; gap: 0.5in; }
      .resume-left { flex: 7; }
      .resume-right { flex: 3; background: #f8f9fa; padding: 0.2in; margin-top: 0.8in; border-radius: 8px; height: fit-content; }
      .resume-header { margin-bottom: 0.3in; border-bottom: 3px solid #2563eb; padding-bottom: 0.1in; }
      .resume-name { font-size: 28px; font-weight: bold; color: #1e293b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1px; }
      .resume-title { font-size: 14px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
      .resume-section { margin-bottom: 0.2in; }
      .resume-section-title { font-size: 14px; font-weight: bold; color: #1e293b; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; }
      .resume-summary { font-size: 11px; line-height: 1.6; color: #374151; }
      .resume-exp-item { margin-bottom: 14px; }
      .resume-exp-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
      .resume-exp-role { font-size: 13px; font-weight: bold; color: #1e293b; }
      .resume-exp-company { font-size: 11px; font-weight: 600; color: #2563eb; margin-bottom: 4px; }
      .resume-exp-duration { font-size: 10px; color: #64748b; font-style: italic; white-space: nowrap; }
      .resume-exp-desc { font-size: 10px; line-height: 1.5; color: #374151; }
      .resume-bullet-item { font-size: 10px; line-height: 1.4; color: #374151; margin-bottom: 3px; display: flex; }
      .resume-bullet { font-size: 8px; color: #2563eb; margin-right: 6px; margin-top: 2px; font-weight: bold; flex-shrink: 0; }
      .resume-sidebar-title { font-size: 13px; font-weight: bold; margin-bottom: 8px; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; }
      .resume-sidebar-section { margin-bottom: 20px; }
      .resume-detail { font-size: 10px; color: #374151; margin-bottom: 5px; }
      .resume-link { font-size: 10px; color: #2563eb; margin-bottom: 5px; text-decoration: none; }
      .resume-skill { font-size: 9px; color: #374151; margin-bottom: 2px; }
      .resume-edu-item { margin-bottom: 10px; }
      .resume-edu-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px; }
      .resume-edu-degree { font-size: 11px; font-weight: bold; color: #1e293b; }
      .resume-edu-institution { font-size: 10px; color: #2563eb; font-weight: 600; }
      .resume-edu-year { font-size: 9px; color: #64748b; font-style: italic; }
      ${EDITABLE_CSS}`,
  },
  {
    id: "classic",
    name: "Classic",
    description: "Single column, serif font, horizontal rule separators",
    layout: "single-column",
    css: `${BASE_RESET}
      .resume-page { font-family: 'Georgia', 'Times New Roman', serif; font-size: 11px; line-height: 1.5; color: #222; background: white; width: 100%; min-height: 11in; padding: 0.6in 0.8in; display: block; }
      .resume-right { display: none; }
      .resume-left { width: 100%; }
      .resume-header { text-align: center; margin-bottom: 0.25in; padding-bottom: 0.15in; border-bottom: 1px solid #333; }
      .resume-name { font-size: 24px; font-weight: normal; color: #111; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px; }
      .resume-title { font-size: 12px; color: #555; font-style: italic; }
      .resume-section { margin-bottom: 0.2in; }
      .resume-section-title { font-size: 12px; font-weight: bold; color: #111; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-bottom: 8px; }
      .resume-summary { font-size: 11px; line-height: 1.6; color: #333; }
      .resume-exp-item { margin-bottom: 12px; }
      .resume-exp-header { display: flex; justify-content: space-between; margin-bottom: 3px; }
      .resume-exp-role { font-size: 12px; font-weight: bold; color: #111; }
      .resume-exp-company { font-size: 11px; color: #444; font-style: italic; margin-bottom: 3px; }
      .resume-exp-duration { font-size: 10px; color: #666; }
      .resume-exp-desc { font-size: 10px; line-height: 1.5; color: #333; }
      .resume-bullet-item { font-size: 10px; line-height: 1.4; color: #333; margin-bottom: 2px; display: flex; }
      .resume-bullet { margin-right: 6px; color: #333; flex-shrink: 0; }
      .resume-sidebar-title { display: none; }
      .resume-sidebar-section { display: none; }
      .resume-detail { display: none; }
      .resume-link { display: none; }
      .resume-skill { display: none; }
      .resume-edu-item { margin-bottom: 8px; }
      .resume-edu-header { display: flex; justify-content: space-between; margin-bottom: 2px; }
      .resume-edu-degree { font-size: 11px; font-weight: bold; color: #111; }
      .resume-edu-institution { font-size: 10px; color: #444; font-style: italic; }
      .resume-edu-year { font-size: 10px; color: #666; }
      ${EDITABLE_CSS}`,
  },
  {
    id: "traditional",
    name: "Traditional",
    description: "Centered header with accent color band, two-column body",
    layout: "two-column",
    css: `${BASE_RESET}
      .resume-page { font-family: 'Cambria', 'Georgia', serif; font-size: 10px; line-height: 1.45; color: #2d2d2d; background: white; width: 100%; min-height: 11in; padding: 0in; display: flex; flex-direction: column; }
      .resume-left { padding: 0.4in 0.6in; flex: 1; }
      .resume-right { display: none; }
      .resume-header { background: #1a365d; color: white; padding: 0.35in 0.6in; text-align: center; margin-bottom: 0; }
      .resume-name { font-size: 26px; font-weight: bold; color: white; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px; }
      .resume-title { font-size: 13px; color: #bfdbfe; font-weight: 400; letter-spacing: 1px; }
      .resume-section { margin-bottom: 0.2in; }
      .resume-section-title { font-size: 13px; font-weight: bold; color: #1a365d; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #1a365d; padding-bottom: 3px; margin-bottom: 10px; }
      .resume-summary { font-size: 10.5px; line-height: 1.6; color: #374151; }
      .resume-exp-item { margin-bottom: 14px; }
      .resume-exp-header { display: flex; justify-content: space-between; margin-bottom: 3px; }
      .resume-exp-role { font-size: 12px; font-weight: bold; color: #1a365d; }
      .resume-exp-company { font-size: 11px; color: #2563eb; font-weight: 600; margin-bottom: 3px; }
      .resume-exp-duration { font-size: 10px; color: #64748b; font-style: italic; white-space: nowrap; }
      .resume-exp-desc { font-size: 10px; line-height: 1.5; color: #374151; }
      .resume-bullet-item { font-size: 10px; line-height: 1.4; color: #374151; margin-bottom: 2px; display: flex; }
      .resume-bullet { color: #1a365d; margin-right: 6px; flex-shrink: 0; font-weight: bold; }
      .resume-sidebar-title { display: none; }
      .resume-sidebar-section { display: none; }
      .resume-detail { display: none; }
      .resume-link { display: none; }
      .resume-skill { display: none; }
      .resume-edu-item { margin-bottom: 10px; }
      .resume-edu-header { display: flex; justify-content: space-between; margin-bottom: 2px; }
      .resume-edu-degree { font-size: 11px; font-weight: bold; color: #1a365d; }
      .resume-edu-institution { font-size: 10px; color: #2563eb; font-weight: 600; }
      .resume-edu-year { font-size: 10px; color: #64748b; font-style: italic; }
      ${EDITABLE_CSS}`,
  },
  {
    id: "professional",
    name: "Professional",
    description: "Left sidebar with skills, main content right",
    layout: "sidebar-left",
    css: `${BASE_RESET}
      .resume-page { font-family: 'Inter', -apple-system, sans-serif; font-size: 10px; line-height: 1.4; color: #333; background: white; width: 100%; min-height: 11in; padding: 0; display: flex; flex-direction: row-reverse; gap: 0; }
      .resume-left { flex: 7; padding: 0.5in 0.5in 0.5in 0.3in; }
      .resume-right { flex: 3; background: #1e293b; color: white; padding: 0.5in 0.25in; }
      .resume-header { margin-bottom: 0.25in; padding-bottom: 0.1in; border-bottom: 2px solid #e2e8f0; }
      .resume-name { font-size: 26px; font-weight: bold; color: #1e293b; margin-bottom: 4px; }
      .resume-title { font-size: 13px; color: #64748b; font-weight: 500; }
      .resume-section { margin-bottom: 0.2in; }
      .resume-section-title { font-size: 13px; font-weight: bold; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px; }
      .resume-summary { font-size: 10.5px; line-height: 1.6; color: #374151; }
      .resume-exp-item { margin-bottom: 14px; }
      .resume-exp-header { display: flex; justify-content: space-between; margin-bottom: 3px; }
      .resume-exp-role { font-size: 12px; font-weight: bold; color: #1e293b; }
      .resume-exp-company { font-size: 11px; font-weight: 600; color: #3b82f6; margin-bottom: 3px; }
      .resume-exp-duration { font-size: 10px; color: #64748b; font-style: italic; white-space: nowrap; }
      .resume-exp-desc { font-size: 10px; line-height: 1.5; color: #374151; }
      .resume-bullet-item { font-size: 10px; line-height: 1.4; color: #374151; margin-bottom: 2px; display: flex; }
      .resume-bullet { color: #3b82f6; margin-right: 6px; flex-shrink: 0; font-weight: bold; }
      .resume-sidebar-title { font-size: 12px; font-weight: bold; margin-bottom: 8px; color: white; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 4px; }
      .resume-sidebar-section { margin-bottom: 20px; }
      .resume-detail { font-size: 10px; color: #cbd5e1; margin-bottom: 5px; }
      .resume-link { font-size: 10px; color: #93c5fd; margin-bottom: 5px; text-decoration: none; }
      .resume-skill { font-size: 9px; color: #e2e8f0; margin-bottom: 3px; }
      .resume-edu-item { margin-bottom: 10px; }
      .resume-edu-header { display: flex; justify-content: space-between; margin-bottom: 2px; }
      .resume-edu-degree { font-size: 11px; font-weight: bold; color: #1e293b; }
      .resume-edu-institution { font-size: 10px; color: #3b82f6; font-weight: 600; }
      .resume-edu-year { font-size: 10px; color: #64748b; font-style: italic; }
      ${EDITABLE_CSS}`,
  },
  {
    id: "prime-ats",
    name: "Prime ATS",
    description: "Colored header band, skills sidebar, ATS-optimized",
    layout: "two-column",
    css: `${BASE_RESET}
      .resume-page { font-family: 'Inter', -apple-system, sans-serif; font-size: 10px; line-height: 1.4; color: #333; background: white; width: 100%; min-height: 11in; padding: 0; display: flex; flex-direction: column; }
      .resume-left { padding: 0.3in 0.6in; }
      .resume-right { background: #f1f5f9; padding: 0.3in 0.6in; border-top: 1px solid #e2e8f0; }
      .resume-header { background: #dc2626; color: white; padding: 0.3in 0.6in; }
      .resume-name { font-size: 26px; font-weight: bold; color: white; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; }
      .resume-title { font-size: 12px; color: #fecaca; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
      .resume-section { margin-bottom: 0.2in; }
      .resume-section-title { font-size: 12px; font-weight: bold; color: #dc2626; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #fecaca; padding-bottom: 3px; margin-bottom: 8px; }
      .resume-summary { font-size: 10.5px; line-height: 1.6; color: #374151; }
      .resume-exp-item { margin-bottom: 12px; }
      .resume-exp-header { display: flex; justify-content: space-between; margin-bottom: 3px; }
      .resume-exp-role { font-size: 12px; font-weight: bold; color: #111; }
      .resume-exp-company { font-size: 11px; font-weight: 600; color: #dc2626; margin-bottom: 3px; }
      .resume-exp-duration { font-size: 10px; color: #64748b; font-style: italic; white-space: nowrap; }
      .resume-exp-desc { font-size: 10px; line-height: 1.5; color: #374151; }
      .resume-bullet-item { font-size: 10px; line-height: 1.4; color: #374151; margin-bottom: 2px; display: flex; }
      .resume-bullet { color: #dc2626; margin-right: 6px; flex-shrink: 0; font-weight: bold; }
      .resume-sidebar-title { font-size: 11px; font-weight: bold; margin-bottom: 6px; color: #dc2626; text-transform: uppercase; letter-spacing: 0.5px; }
      .resume-sidebar-section { margin-bottom: 15px; display: inline-block; vertical-align: top; width: 48%; margin-right: 2%; }
      .resume-detail { font-size: 10px; color: #374151; margin-bottom: 4px; }
      .resume-link { font-size: 10px; color: #dc2626; margin-bottom: 4px; text-decoration: none; }
      .resume-skill { font-size: 9px; color: #374151; margin-bottom: 2px; display: inline-block; background: #fee2e2; padding: 2px 8px; border-radius: 10px; margin-right: 4px; }
      .resume-edu-item { margin-bottom: 8px; }
      .resume-edu-header { display: flex; justify-content: space-between; margin-bottom: 2px; }
      .resume-edu-degree { font-size: 11px; font-weight: bold; color: #111; }
      .resume-edu-institution { font-size: 10px; color: #dc2626; font-weight: 600; }
      .resume-edu-year { font-size: 10px; color: #64748b; font-style: italic; }
      ${EDITABLE_CSS}`,
  },
  {
    id: "pure-ats",
    name: "Pure ATS",
    description: "Minimal single column, no colors, maximum ATS compatibility",
    layout: "single-column",
    css: `${BASE_RESET}
      .resume-page { font-family: 'Arial', 'Helvetica', sans-serif; font-size: 10.5px; line-height: 1.5; color: #000; background: white; width: 100%; min-height: 11in; padding: 0.5in 0.75in; display: block; }
      .resume-right { display: none; }
      .resume-left { width: 100%; }
      .resume-header { margin-bottom: 0.15in; border-bottom: 1px solid #000; padding-bottom: 0.1in; }
      .resume-name { font-size: 20px; font-weight: bold; color: #000; margin-bottom: 4px; }
      .resume-title { font-size: 12px; color: #333; }
      .resume-section { margin-bottom: 0.15in; }
      .resume-section-title { font-size: 12px; font-weight: bold; color: #000; text-transform: uppercase; border-bottom: 1px solid #666; padding-bottom: 2px; margin-bottom: 6px; }
      .resume-summary { font-size: 10.5px; line-height: 1.5; color: #000; }
      .resume-exp-item { margin-bottom: 10px; }
      .resume-exp-header { display: flex; justify-content: space-between; margin-bottom: 2px; }
      .resume-exp-role { font-size: 11px; font-weight: bold; color: #000; }
      .resume-exp-company { font-size: 10.5px; color: #000; margin-bottom: 2px; }
      .resume-exp-duration { font-size: 10px; color: #333; white-space: nowrap; }
      .resume-exp-desc { font-size: 10px; line-height: 1.5; color: #000; }
      .resume-bullet-item { font-size: 10px; line-height: 1.4; color: #000; margin-bottom: 2px; display: flex; }
      .resume-bullet { color: #000; margin-right: 6px; flex-shrink: 0; }
      .resume-sidebar-title { display: none; }
      .resume-sidebar-section { display: none; }
      .resume-detail { display: none; }
      .resume-link { display: none; }
      .resume-skill { display: none; }
      .resume-edu-item { margin-bottom: 6px; }
      .resume-edu-header { display: flex; justify-content: space-between; margin-bottom: 1px; }
      .resume-edu-degree { font-size: 11px; font-weight: bold; color: #000; }
      .resume-edu-institution { font-size: 10.5px; color: #000; }
      .resume-edu-year { font-size: 10px; color: #333; }
      ${EDITABLE_CSS}`,
  },
  {
    id: "specialist",
    name: "Specialist",
    description: "Clean single column with bold section headers, technical focus",
    layout: "single-column",
    css: `${BASE_RESET}
      .resume-page { font-family: 'Inter', -apple-system, sans-serif; font-size: 10px; line-height: 1.45; color: #1a1a1a; background: white; width: 100%; min-height: 11in; padding: 0.5in 0.7in; display: block; }
      .resume-right { display: none; }
      .resume-left { width: 100%; }
      .resume-header { margin-bottom: 0.2in; }
      .resume-name { font-size: 22px; font-weight: 800; color: #000; margin-bottom: 2px; }
      .resume-title { font-size: 12px; color: #6b7280; font-weight: 500; margin-bottom: 6px; }
      .resume-section { margin-bottom: 0.18in; }
      .resume-section-title { font-size: 11px; font-weight: 800; color: #000; text-transform: uppercase; letter-spacing: 1.5px; background: #f3f4f6; padding: 4px 8px; margin-bottom: 8px; border-left: 3px solid #000; }
      .resume-summary { font-size: 10.5px; line-height: 1.6; color: #374151; }
      .resume-exp-item { margin-bottom: 12px; }
      .resume-exp-header { display: flex; justify-content: space-between; margin-bottom: 3px; }
      .resume-exp-role { font-size: 12px; font-weight: 700; color: #000; }
      .resume-exp-company { font-size: 11px; color: #4b5563; font-weight: 600; margin-bottom: 3px; }
      .resume-exp-duration { font-size: 10px; color: #6b7280; white-space: nowrap; }
      .resume-exp-desc { font-size: 10px; line-height: 1.5; color: #374151; }
      .resume-bullet-item { font-size: 10px; line-height: 1.4; color: #374151; margin-bottom: 2px; display: flex; }
      .resume-bullet { color: #000; margin-right: 6px; flex-shrink: 0; font-weight: bold; }
      .resume-sidebar-title { display: none; }
      .resume-sidebar-section { display: none; }
      .resume-detail { display: none; }
      .resume-link { display: none; }
      .resume-skill { display: none; }
      .resume-edu-item { margin-bottom: 8px; }
      .resume-edu-header { display: flex; justify-content: space-between; margin-bottom: 2px; }
      .resume-edu-degree { font-size: 11px; font-weight: bold; color: #000; }
      .resume-edu-institution { font-size: 10px; color: #4b5563; font-weight: 600; }
      .resume-edu-year { font-size: 10px; color: #6b7280; }
      ${EDITABLE_CSS}`,
  },
  {
    id: "clean",
    name: "Clean",
    description: "Modern sans-serif, bold name, two-column with colored sidebar",
    layout: "two-column",
    css: `${BASE_RESET}
      .resume-page { font-family: 'Inter', -apple-system, sans-serif; font-size: 10px; line-height: 1.4; color: #333; background: white; width: 100%; min-height: 11in; padding: 0; display: flex; gap: 0; }
      .resume-left { flex: 7; padding: 0.5in 0.4in 0.5in 0.5in; }
      .resume-right { flex: 3; background: #0f172a; color: #e2e8f0; padding: 0.5in 0.25in; }
      .resume-header { margin-bottom: 0.25in; }
      .resume-name { font-size: 30px; font-weight: 900; color: #0f172a; margin-bottom: 4px; letter-spacing: -0.5px; }
      .resume-title { font-size: 13px; color: #3b82f6; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
      .resume-section { margin-bottom: 0.2in; }
      .resume-section-title { font-size: 13px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 2px solid #3b82f6; }
      .resume-summary { font-size: 10.5px; line-height: 1.6; color: #374151; }
      .resume-exp-item { margin-bottom: 14px; }
      .resume-exp-header { display: flex; justify-content: space-between; margin-bottom: 3px; }
      .resume-exp-role { font-size: 12px; font-weight: bold; color: #0f172a; }
      .resume-exp-company { font-size: 11px; font-weight: 600; color: #3b82f6; margin-bottom: 3px; }
      .resume-exp-duration { font-size: 10px; color: #64748b; font-style: italic; white-space: nowrap; }
      .resume-exp-desc { font-size: 10px; line-height: 1.5; color: #374151; }
      .resume-bullet-item { font-size: 10px; line-height: 1.4; color: #374151; margin-bottom: 2px; display: flex; }
      .resume-bullet { color: #3b82f6; margin-right: 6px; flex-shrink: 0; font-weight: bold; }
      .resume-sidebar-title { font-size: 11px; font-weight: bold; margin-bottom: 8px; color: #3b82f6; text-transform: uppercase; letter-spacing: 1px; }
      .resume-sidebar-section { margin-bottom: 20px; }
      .resume-detail { font-size: 10px; color: #cbd5e1; margin-bottom: 5px; }
      .resume-link { font-size: 10px; color: #93c5fd; margin-bottom: 5px; text-decoration: none; }
      .resume-skill { font-size: 9px; color: #e2e8f0; margin-bottom: 3px; }
      .resume-edu-item { margin-bottom: 10px; }
      .resume-edu-header { display: flex; justify-content: space-between; margin-bottom: 2px; }
      .resume-edu-degree { font-size: 11px; font-weight: bold; color: #0f172a; }
      .resume-edu-institution { font-size: 10px; color: #3b82f6; font-weight: 600; }
      .resume-edu-year { font-size: 10px; color: #64748b; font-style: italic; }
      ${EDITABLE_CSS}`,
  },
  {
    id: "simple-ats",
    name: "Simple ATS",
    description: "Single column, subtle section dividers, ATS-friendly",
    layout: "single-column",
    css: `${BASE_RESET}
      .resume-page { font-family: 'Calibri', 'Segoe UI', sans-serif; font-size: 10.5px; line-height: 1.5; color: #1a1a1a; background: white; width: 100%; min-height: 11in; padding: 0.5in 0.75in; display: block; }
      .resume-right { display: none; }
      .resume-left { width: 100%; }
      .resume-header { margin-bottom: 0.2in; padding-bottom: 0.1in; border-bottom: 2px solid #2563eb; }
      .resume-name { font-size: 22px; font-weight: bold; color: #1a1a1a; margin-bottom: 3px; }
      .resume-title { font-size: 12px; color: #2563eb; font-weight: 500; }
      .resume-section { margin-bottom: 0.18in; }
      .resume-section-title { font-size: 12px; font-weight: bold; color: #2563eb; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #dbeafe; padding-bottom: 3px; margin-bottom: 8px; }
      .resume-summary { font-size: 10.5px; line-height: 1.6; color: #333; }
      .resume-exp-item { margin-bottom: 12px; }
      .resume-exp-header { display: flex; justify-content: space-between; margin-bottom: 3px; }
      .resume-exp-role { font-size: 11.5px; font-weight: bold; color: #1a1a1a; }
      .resume-exp-company { font-size: 10.5px; color: #2563eb; font-weight: 600; margin-bottom: 3px; }
      .resume-exp-duration { font-size: 10px; color: #6b7280; white-space: nowrap; }
      .resume-exp-desc { font-size: 10px; line-height: 1.5; color: #333; }
      .resume-bullet-item { font-size: 10px; line-height: 1.4; color: #333; margin-bottom: 2px; display: flex; }
      .resume-bullet { color: #2563eb; margin-right: 6px; flex-shrink: 0; }
      .resume-sidebar-title { display: none; }
      .resume-sidebar-section { display: none; }
      .resume-detail { display: none; }
      .resume-link { display: none; }
      .resume-skill { display: none; }
      .resume-edu-item { margin-bottom: 8px; }
      .resume-edu-header { display: flex; justify-content: space-between; margin-bottom: 2px; }
      .resume-edu-degree { font-size: 11px; font-weight: bold; color: #1a1a1a; }
      .resume-edu-institution { font-size: 10px; color: #2563eb; font-weight: 600; }
      .resume-edu-year { font-size: 10px; color: #6b7280; }
      ${EDITABLE_CSS}`,
  },
];

export function getTemplateById(id: string): ResumeTemplate {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}

export function getTemplateCSS(id: string): string {
  return getTemplateById(id).css;
}
