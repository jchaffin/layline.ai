/**
 * Normalizes job analysis from API/LLM so list fields are arrays and text is trimmed.
 * Handles cases where the model returns a string instead of an array (e.g. comma/newline-separated).
 */
export type NormalizedAnalysis = {
  company?: string;
  role?: string;
  companyInfo?: string;
  companyLogoUrl?: string;
  experience?: string;
  experienceLevel?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  qualifications: string[];
  workType?: string;
  location?: string;
  keywords?: string[];
  interviewProcess?: { step: number; name: string; duration?: string }[];
};

function ensureStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : String(item).trim()))
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[\n,;]|(?:\s*[-•*]\s*)/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function trimString(value: unknown): string | undefined {
  if (value == null) return undefined;
  const s = typeof value === "string" ? value : String(value);
  const trimmed = s.trim();
  return trimmed === "" ? undefined : trimmed;
}

export function normalizeJobAnalysis(analysis: unknown): NormalizedAnalysis {
  const raw = analysis && typeof analysis === "object" ? (analysis as Record<string, unknown>) : {};
  return {
    company: trimString(raw.company),
    role: trimString(raw.role),
    companyInfo: trimString(raw.companyInfo),
    companyLogoUrl: trimString(raw.companyLogoUrl),
    experience: trimString(raw.experience),
    experienceLevel: trimString(raw.experienceLevel),
    requiredSkills: ensureStringArray(raw.requiredSkills),
    preferredSkills: ensureStringArray(raw.preferredSkills),
    responsibilities: ensureStringArray(raw.responsibilities),
    qualifications: ensureStringArray(raw.qualifications),
    workType: trimString(raw.workType),
    location: trimString(raw.location),
    keywords: Array.isArray(raw.keywords)
      ? (raw.keywords as unknown[]).map((k) => String(k).trim()).filter(Boolean)
      : undefined,
    interviewProcess: Array.isArray(raw.interviewProcess)
      ? (raw.interviewProcess as { step?: number; name?: string; duration?: string }[])
          .map((s, i) => ({
            step: typeof s.step === "number" ? s.step : i + 1,
            name: trimString(s.name) ?? `Step ${i + 1}`,
            duration: trimString(s.duration),
          }))
          .filter((s) => s.name)
      : undefined,
  };
}

/**
 * Cleans raw description text for display: collapse excessive newlines, trim lines, limit length.
 */
export function cleanDescriptionText(text: string | undefined | null, maxLength?: number): string {
  if (text == null || text === "") return "";
  let out = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const lines = out.split("\n").map((line) => line.trim());
  out = lines.join("\n").replace(/\n{3,}/g, "\n\n");
  if (typeof maxLength === "number" && out.length > maxLength) {
    out = out.slice(0, maxLength).trim() + "\n\n…";
  }
  return out;
}
