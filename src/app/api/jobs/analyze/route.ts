import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/api/openai";
import pdfParse from "@jchaffin/pdf-parse";
import { computeMatchScore } from "@/lib/resumeJobMatch";
import type { ParsedResume } from "@/lib/schema";
import { cleanText, fetchViaScrapeless, htmlToStructuredText, extractLinkedInJobDetail } from "@/lib/jobScraper";
import { normalizeJobAnalysis } from "@/lib/analysisUtils";

async function fetchUrlHtml(url: string): Promise<string | null> {
  let fetchUrl = url;
  if (url.includes("linkedin.com")) {
    const jobIdMatch =
      url.match(/currentJobId=(\d+)/) ||
      url.match(/jobs\/view\/[^/]*?(\d{8,})/) ||
      url.match(/jobs\/view\/(\d+)/);
    if (jobIdMatch) {
      fetchUrl = `https://www.linkedin.com/jobs/view/${jobIdMatch[1]}`;
    }
  }

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
  };

  const htmlFromScraper = await fetchViaScrapeless(fetchUrl);
  if (htmlFromScraper) return htmlFromScraper;

  const fetchResponse = await fetch(fetchUrl, { headers });
  if (!fetchResponse.ok) return null;
  return fetchResponse.text();
}

function extractLocationFallback(text: string): string {
  const source = text || "";

  if (/\bremote\b/i.test(source)) return "Remote";

  const metroMatch = source.match(
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\s+Metropolitan Area)\b/,
  );
  if (metroMatch?.[1]) return metroMatch[1];

  const cityStateMatch = source.match(
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3},\s*[A-Z]{2})\b/,
  );
  if (cityStateMatch?.[1]) return cityStateMatch[1];

  const usCityStateNameMatch = source.match(
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3},\s*(?:Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming))\b/,
  );
  if (usCityStateNameMatch?.[1]) return usCityStateNameMatch[1];

  return "";
}

async function fetchDescriptionFromUrl(url: string): Promise<string | null> {
  const htmlContent = await fetchUrlHtml(url);

  if (!htmlContent) return null;

  if (url.includes("linkedin.com")) {
    const detail = extractLinkedInJobDetail(htmlContent);
    if (detail.description && detail.description.length > 20) return detail.description;
  }

  const textContent = htmlToStructuredText(htmlContent);
  if (textContent.length < 100) return null;
  return textContent;
}

async function extractLocationFromUrl(url: string): Promise<string> {
  const htmlContent = await fetchUrlHtml(url);
  if (!htmlContent) return "";

  if (url.includes("linkedin.com")) {
    const titleMatch = htmlContent.match(
      /<title[^>]*>[\s\S]*?\sin\s([^|<]+?)\s\|\sLinkedIn[\s\S]*?<\/title>/i,
    );
    if (titleMatch?.[1]) {
      return cleanText(titleMatch[1]).trim();
    }

    const ldJsonMatch = htmlContent.match(
      /"addressLocality"\s*:\s*"([^"]+)"/i,
    );
    if (ldJsonMatch?.[1]) {
      return cleanText(ldJsonMatch[1]).trim();
    }
  }

  return "";
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let description: string | undefined;
    let url: string | undefined;
    let jobDescription: string | undefined;
    let resume: ParsedResume | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const resumeJson = formData.get("resume") as string | null;

      if (resumeJson) {
        try { resume = JSON.parse(resumeJson); } catch {}
      }

      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
          const data = await pdfParse(buffer);
          description = data.text;
        } else {
          description = buffer.toString("utf-8");
        }
      }

      description = description || (formData.get("description") as string) || undefined;
      url = (formData.get("url") as string) || undefined;
    } else {
      const body = await request.text();
      let parsedBody;
      try {
        parsedBody = JSON.parse(body);
      } catch {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
      }
      description = parsedBody.description;
      url = parsedBody.url;
      jobDescription = parsedBody.jobDescription;
      resume = parsedBody.resume;
    }

    let jobDescriptionText = description || jobDescription;
    let employerLogoFromUrl: string | null = null;

    if (url) {
      try {
        const htmlContent = await fetchUrlHtml(url);
        console.log(`[analyze] URL: ${url}, HTML fetched: ${htmlContent ? htmlContent.length + ' chars' : 'null'}`);
        if (htmlContent) {
          if (url.includes("linkedin.com")) {
            const detail = extractLinkedInJobDetail(htmlContent);
            if (!jobDescriptionText) jobDescriptionText = detail.description || undefined;
            if (detail.employer_logo) employerLogoFromUrl = detail.employer_logo;
            console.log(`[analyze] LinkedIn logo extracted: ${employerLogoFromUrl || 'null'}`);
          } else {
            if (!jobDescriptionText) {
              jobDescriptionText = htmlToStructuredText(htmlContent);
              if (jobDescriptionText.length < 100) jobDescriptionText = undefined;
            }
          }
        }
        if (!jobDescriptionText) throw new Error("Insufficient content extracted");
      } catch (e) {
        console.error(`[analyze] Fetch error:`, e);
        if (!jobDescriptionText) {
          return NextResponse.json(
            { error: "Could not fetch job description from URL." },
            { status: 400 },
          );
        }
      }
    }

    if (!jobDescriptionText || jobDescriptionText.trim() === "") {
      return NextResponse.json(
        { error: "Job description is required" },
        { status: 400 }
      );
    }

    const cleanDescription = jobDescriptionText
      .replace(/[\x00-\x1F\x7F-\x9F]/g, " ")
      .trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Analyze the job description and extract structured data. Return JSON with this exact structure:
{
  "company": "Company Name",
  "role": "Job Title",
  "experience": "3+ years of relevant experience required",
  "requiredSkills": ["skill1", "skill2"],
  "preferredSkills": ["skill3", "skill4"],
  "responsibilities": ["responsibility1", "responsibility2"],
  "qualifications": ["qualification1", "qualification2"],
  "experienceLevel": "Entry/Mid/Senior/Executive",
  "requiredYears": 3,
  "location": "City, State",
  "workType": "Remote/Hybrid/Onsite",
  "companyInfo": "Brief company description",
  "interviewProcess": [
    {"step": 1, "name": "Recruiter Screen", "duration": "15 min"},
    {"step": 2, "name": "Hiring Manager Screen", "duration": "30 min"},
    {"step": 3, "name": "Technical Screen", "duration": "60 min"},
    {"step": 4, "name": "Work Trial", "duration": "1-2 days"}
  ],
  "keywords": ["keyword1", "keyword2"],
  "sentiment": 0.8
}

CRITICAL - Skills extraction:
- "requiredSkills" and "preferredSkills" must list actual job skills: technologies (e.g. Python, React, AWS), tools, frameworks, methodologies, languages, certifications, domain knowledge. Extract every skill, technology, and requirement mentioned (must-have in requiredSkills, nice-to-have in preferredSkills).
- Do NOT put job title, role name, or seniority in skills. Do NOT use "Senior", "Engineer", "Entry", "Mid", "Executive", or the job title as skill items. Those belong only in "role" and "experienceLevel".

For "interviewProcess", extract the EXACT interview steps mentioned in the job description using their actual names and durations. If no interview process is described, return an empty array.`,
        },
        {
          role: "user",
          content: `Analyze this job description and extract all relevant information:\n\n${cleanDescription}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const rawAnalysis = JSON.parse(
      completion.choices[0].message.content || "{}"
    );
    if (employerLogoFromUrl) rawAnalysis.companyLogoUrl = employerLogoFromUrl;
    const analysis = normalizeJobAnalysis(rawAnalysis);

    const aiLocation = typeof analysis.location === "string" ? analysis.location.trim() : "";
    const locationNormalized = aiLocation.toLowerCase();
    const looksLikeWorkType =
      locationNormalized === "hybrid" ||
      locationNormalized === "remote" ||
      locationNormalized === "onsite" ||
      locationNormalized === "on-site";
    const needsLocationFallback =
      !aiLocation ||
      locationNormalized === "not specified" ||
      locationNormalized === "unspecified" ||
      locationNormalized === "unknown" ||
      locationNormalized === "n/a" ||
      looksLikeWorkType;
    if (needsLocationFallback) {
      let fallbackLocation = "";
      if (url) {
        fallbackLocation = await extractLocationFromUrl(url);
      }
      if (!fallbackLocation) {
        fallbackLocation = extractLocationFallback(cleanDescription);
      }
      if (fallbackLocation) {
        analysis.location = fallbackLocation;
      } else if (looksLikeWorkType) {
        analysis.location = "";
      }
    }

    const allSkills = [
      ...(analysis.requiredSkills || []),
      ...(analysis.preferredSkills || []),
    ];

    const descParts: string[] = [];
    if (analysis.companyInfo) descParts.push(analysis.companyInfo);
    if (analysis.experience) descParts.push(`Experience: ${analysis.experience}`);
    descParts.push(cleanDescription);

    const job = {
      id: `uploaded-${Date.now()}`,
      title: analysis.role || "Untitled Role",
      company: analysis.company || "Unknown Company",
      location: analysis.location || "",
      description: descParts.join("\n\n"),
      url: url || "",
      posted: new Date().toISOString(),
      job_posted_at_datetime_utc: new Date().toISOString(),
      salary: null as string | null,
      type: analysis.workType || "Full-time",
      job_is_remote: (analysis.workType || "").toLowerCase().includes("remote"),
      source: "Uploaded",
      tags: allSkills.length > 0 ? allSkills : (analysis.keywords || []),
      employer_logo: employerLogoFromUrl || null,
      job_highlights: {
        Qualifications: analysis.qualifications || [],
        Responsibilities: analysis.responsibilities || [],
        Benefits: [] as string[],
      },
      matchScore: undefined as number | undefined,
      matchReasons: undefined as string[] | undefined,
      matchedSkills: undefined as string[] | undefined,
      missingSkills: undefined as string[] | undefined,
    };

    if (resume) {
      const { score, reasons, matchedSkills, missingSkills } = computeMatchScore(resume, job);
      job.matchScore = score;
      job.matchReasons = reasons;
      job.matchedSkills = matchedSkills;
      job.missingSkills = missingSkills;
    }

    return NextResponse.json({ job, analysis });
  } catch (error) {
    console.error("Job analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze job description" },
      { status: 500 }
    );
  }
}
