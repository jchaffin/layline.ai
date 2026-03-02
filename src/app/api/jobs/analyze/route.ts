import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/api/openai";
import pdfParse from "@jchaffin/pdf-parse";
import { computeMatchScore } from "@/lib/resumeJobMatch";
import type { ParsedResume } from "@/lib/schema";

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

    if (url && !jobDescriptionText) {
      try {
        let fetchUrl = url;
        const headers = {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
        };

        if (url.includes("linkedin.com")) {
          const jobIdMatch = url.match(/currentJobId=(\d+)/) || url.match(/jobs\/view\/[^/]*?(\d{8,})/) || url.match(/jobs\/view\/(\d+)/);
          if (jobIdMatch) {
            fetchUrl = `https://www.linkedin.com/jobs/view/${jobIdMatch[1]}`;
          }
        }

        const fetchResponse = await fetch(fetchUrl, { headers });
        if (!fetchResponse.ok) throw new Error(`HTTP ${fetchResponse.status}`);
        const htmlContent = await fetchResponse.text();

        if (fetchUrl.includes("linkedin.com")) {
          const descMatch = htmlContent.match(
            /class="show-more-less-html__markup[^"]*"[^>]*>([\s\S]*?)<\/div>/,
          );
          if (descMatch) {
            jobDescriptionText = descMatch[1]
              .replace(/<[^>]*>/g, " ")
              .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
              .replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
              .replace(/\s+/g, " ")
              .trim();
          }
        }

        if (!jobDescriptionText) {
          const textContent = htmlContent
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim();

          if (textContent.length < 100) throw new Error("Insufficient content extracted");
          jobDescriptionText = textContent;
        }
      } catch {
        return NextResponse.json(
          { error: "Could not fetch job description from URL." },
          { status: 400 },
        );
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

For "interviewProcess", extract the EXACT interview steps mentioned in the job description using their actual names and durations. If no interview process is described, return an empty array.`,
        },
        {
          role: "user",
          content: `Analyze this job description and extract all relevant information:\n\n${cleanDescription}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(
      completion.choices[0].message.content || "{}"
    );

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
