import type { ParsedResume } from "@/lib/schema";

export interface MatchResult {
  score: number;
  reasons: string[];
  matchedSkills: string[];
  missingSkills: string[];
}

interface JobLike {
  title: string;
  description?: string;
  tags?: string[];
  job_highlights?: {
    Qualifications?: string[];
    Responsibilities?: string[];
    Benefits?: string[];
  } | null;
  type?: string;
  location?: string;
  job_is_remote?: boolean;
}

function extractResumeSkills(resume: ParsedResume): string[] {
  const skills: string[] = [];
  const seen = new Set<string>();
  const add = (s: string) => {
    const n = normalize(s);
    if (n.length > 1 && !seen.has(n)) { seen.add(n); skills.push(s.trim()); }
  };
  for (const s of resume.skills || []) add(s);
  for (const exp of resume.experience || []) {
    for (const kw of exp.keywords || []) add(kw);
  }
  return skills;
}

function extractJobRequiredSkills(job: JobLike): string[] {
  const text = [
    ...(job.job_highlights?.Qualifications || []),
    ...(job.tags || []),
  ].join("\n");

  const descText = job.description || "";
  const fullText = text.length > 50 ? text : descText;

  const found: string[] = [];
  const seen = new Set<string>();

  const KNOWN = [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin", "Scala", "R",
    "React", "Angular", "Vue", "Svelte", "Next.js", "Nuxt", "Node.js", "Express", "FastAPI", "Django", "Flask", "Spring", "Rails", "Laravel",
    "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform", "Ansible", "CI/CD", "Jenkins", "GitHub Actions", "CircleCI",
    "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "DynamoDB", "Cassandra", "Kafka", "RabbitMQ",
    "GraphQL", "REST", "gRPC", "WebSocket", "Microservices",
    "Git", "Linux", "Bash", "Agile", "Scrum",
    "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "PyTorch", "TensorFlow", "Pandas", "NumPy", "scikit-learn",
    "Figma", "CSS", "Tailwind", "HTML", "Sass", "SCSS",
    "Spark", "Hadoop", "Airflow", "dbt", "Snowflake", "Databricks", "Tableau", "Power BI",
    "OpenCV", "LangChain", "LLM", "RAG", "Transformers", "GPT",
    "iOS", "Android", "React Native", "Flutter", "SwiftUI",
    "Redux", "Zustand", "MobX", "RxJS",
    "Jest", "Cypress", "Playwright", "Selenium",
    "OAuth", "JWT", "SSO", "SAML",
    "Prisma", "Drizzle", "Sequelize", "SQLAlchemy",
    "Vercel", "Netlify", "Heroku", "Cloudflare", "Nginx",
    "Three.js", "D3", "WebGL",
    "Solidity", "Web3", "Ethereum",
  ];

  const lower = fullText.toLowerCase();
  for (const skill of KNOWN) {
    if (lower.includes(skill.toLowerCase()) && !seen.has(normalize(skill))) {
      seen.add(normalize(skill));
      found.push(skill);
    }
  }

  return found;
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9+#.\s/]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 1),
  );
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9+#.]/g, "").trim();
}

function estimateYearsFromResume(resume: ParsedResume): number {
  let totalMonths = 0;
  for (const exp of resume.experience || []) {
    const dur = (exp.duration || "").toLowerCase();
    const yrMatch = dur.match(/(\d+)\s*(?:year|yr)/);
    const moMatch = dur.match(/(\d+)\s*(?:month|mo)/);
    totalMonths += (yrMatch ? parseInt(yrMatch[1]) * 12 : 0) + (moMatch ? parseInt(moMatch[1]) : 0);
    if (!yrMatch && !moMatch && exp.startDate) {
      const start = new Date(exp.startDate).getTime();
      const end = exp.endDate ? new Date(exp.endDate).getTime() : Date.now();
      if (!isNaN(start)) totalMonths += Math.max(0, (end - start) / (1000 * 60 * 60 * 24 * 30));
    }
  }
  if (totalMonths === 0) totalMonths = (resume.experience || []).length * 24;
  return Math.round(totalMonths / 12);
}

function extractRequiredYears(text: string): number | null {
  const patterns = [
    /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/i,
    /(?:minimum|at least|requires?)\s*(\d+)\s*(?:years?|yrs?)/i,
    /(\d+)\s*-\s*\d+\s*(?:years?|yrs?)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return parseInt(m[1]);
  }
  return null;
}

export function computeMatchScore(resume: ParsedResume, job: JobLike): MatchResult {
  const reasons: string[] = [];

  const resumeSkills = extractResumeSkills(resume);
  const resumeSkillsNorm = new Set(resumeSkills.map(normalize));
  const jobRequiredSkills = extractJobRequiredSkills(job);

  const jobText = [
    job.title || "",
    job.description || "",
    ...(job.tags || []),
    ...(job.job_highlights?.Qualifications || []),
    ...(job.job_highlights?.Responsibilities || []),
  ].join(" ").toLowerCase();

  // ── Skills overlap (40 pts) ──
  let skillsScore = 0;
  const matchedSkills: string[] = [];

  for (const skill of resumeSkills) {
    if (jobText.includes(normalize(skill))) {
      matchedSkills.push(skill);
    }
  }

  const count = matchedSkills.length;
  if (count >= 8) skillsScore = 40;
  else if (count >= 5) skillsScore = 32 + (count - 5) * 2.5;
  else if (count >= 3) skillsScore = 22 + (count - 3) * 5;
  else if (count >= 1) skillsScore = 10 + (count - 1) * 6;
  if (count > 0) {
    const display = matchedSkills.slice(0, 5).join(", ");
    reasons.push(count <= 5 ? `Skills: ${display}` : `Skills: ${display} +${count - 5} more`);
  }

  // ── Title relevance (25 pts) ──
  let titleScore = 0;
  const userTitle = resume.experience?.[0]?.role || resume.contact?.title || "";
  const jobTitle = job.title || "";

  if (userTitle && jobTitle) {
    const stopWords = new Set(["the", "a", "an", "and", "or", "at", "in", "for", "of", "to", "with", "is", "i", "ii", "iii", "iv"]);
    const userTokens = tokenize(userTitle);
    const jobTokens = [...tokenize(jobTitle)].filter((t) => !stopWords.has(t) && t.length > 2);

    if (jobTokens.length > 0) {
      let overlap = 0;
      for (const jt of jobTokens) {
        if (userTokens.has(jt)) overlap++;
      }
      if (overlap > 0) {
        titleScore = overlap >= jobTokens.length ? 25 : overlap >= 2 ? 20 : 14;
        reasons.push(overlap >= jobTokens.length ? "Strong role match" : "Similar role");
      }
    }

    const uNorm = userTitle.toLowerCase();
    const jNorm = jobTitle.toLowerCase();
    if (titleScore < 20 && (uNorm.includes(jNorm) || jNorm.includes(uNorm))) {
      titleScore = 22;
      if (!reasons.some((r) => r.startsWith("Role"))) reasons.push("Role title match");
    }
  }

  // ── Resume-to-qualifications match (20 pts) ──
  let qualScore = 0;
  const quals = job.job_highlights?.Qualifications || [];
  if (quals.length > 0) {
    const resumeCorpus = [
      resume.summary || "",
      ...(resume.skills || []),
      ...(resume.experience || []).flatMap((e) => [
        e.role, e.description || "", ...(e.keywords || []), ...(e.achievements || []), ...(e.responsibilities || []),
      ]),
      ...(resume.education || []).map((e) => `${e.degree} ${e.field || ""} ${e.institution}`),
    ].join(" ").toLowerCase();

    let totalPhrases = 0;
    let matchedPhrases = 0;
    for (const q of quals) {
      const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      for (const w of words) {
        totalPhrases++;
        if (resumeCorpus.includes(w)) matchedPhrases++;
      }
    }

    if (totalPhrases > 0) {
      const ratio = matchedPhrases / totalPhrases;
      qualScore = Math.min(20, ratio * 30);
      const pct = Math.round(ratio * 100);
      if (pct > 20) {
        reasons.push(`${pct}% qualification keywords match`);
      }
    }
  } else {
    qualScore = 12;
  }

  // ── Experience level match (15 pts) ──
  const resumeYears = estimateYearsFromResume(resume);
  const qualText2 = [...(job.job_highlights?.Qualifications || []), job.description || ""].join(" ");
  const requiredYears = extractRequiredYears(qualText2);

  let levelScore: number;
  if (requiredYears !== null) {
    const diff = resumeYears - requiredYears;
    if (diff >= 0) {
      levelScore = 15;
      reasons.push(`Meets ${requiredYears}yr experience requirement`);
    } else if (diff >= -2) {
      levelScore = 10;
      reasons.push(`Close to ${requiredYears}yr experience requirement`);
    } else {
      levelScore = 4;
    }
  } else {
    levelScore = resumeYears > 0 ? 10 : 7;
  }

  const missingSkills: string[] = [];
  for (const skill of jobRequiredSkills) {
    if (!resumeSkillsNorm.has(normalize(skill))) {
      missingSkills.push(skill);
    }
  }

  const total = Math.min(100, Math.round(skillsScore + titleScore + qualScore + levelScore));
  return {
    score: total,
    reasons: reasons.slice(0, 5),
    matchedSkills: matchedSkills.slice(0, 8),
    missingSkills: missingSkills.slice(0, 6),
  };
}

export function scoreColor(score: number): string {
  if (score >= 80) return "text-green-700 bg-green-50 border-green-200";
  if (score >= 60) return "text-amber-700 bg-amber-50 border-amber-200";
  if (score >= 40) return "text-orange-700 bg-orange-50 border-orange-200";
  return "text-gray-500 bg-gray-50 border-gray-200";
}
