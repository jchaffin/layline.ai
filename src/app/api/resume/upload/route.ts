import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import mammoth from "mammoth";
import pdfParse from "@jchaffin/pdf-parse";
import { getSessionFromRequest } from "@/lib/api/auth";
import { ingestWorkExperienceResume } from "@/lib/knowledge/ingest";
import {
  buildOriginalResumeKey,
  buildParsedResumeKey,
  createResumeId,
  createResumeVersionId,
  saveResumeObject,
  toGcsUrl,
} from "@/lib/resumeStorage";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    console.log("Resume upload request received");

    let file: File | null = null;
    let textContent: string | null = null;
    let requestedResumeId: string | null = null;

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      file = formData.get("file") as File;
      textContent = formData.get("textContent") as string;
      const resumeIdValue = formData.get("resumeId");
      requestedResumeId =
        typeof resumeIdValue === "string" ? resumeIdValue : null;
    } else if (contentType.includes("application/json")) {
      const body = await request.json();
      textContent = body.textContent;
      requestedResumeId =
        typeof body.resumeId === "string" ? body.resumeId : null;
    } else {
      return NextResponse.json(
        {
          error: "Content-Type must be multipart/form-data or application/json",
        },
        { status: 400 },
      );
    }

    console.log(
      "File:",
      file?.name,
      "TextContent length:",
      textContent?.length,
    );

    let resumeText = "";

    if (file) {
      console.log(
        "Processing file:",
        file.name,
        "Type:",
        file.type,
        "Size:",
        file.size,
      );

      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        try {
          console.log("Using pdf-parse library for text extraction");

          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Custom render function for better text extraction
          function renderPage(pageData: any) {
            const renderOptions = {
              normalizeWhitespace: true,
              disableCombineTextItems: false,
            };

            return pageData.getTextContent(renderOptions).then(function (
              textContent: any,
            ) {
              let lastY: number | null = null;
              let text = "";

              for (let item of textContent.items) {
                if (lastY === item.transform[5] || !lastY) {
                  text += item.str;
                } else {
                  text += "\n" + item.str;
                }
                lastY = item.transform[5];
              }
              return text;
            });
          }

          // Use pdf-parse library with custom options
          const data = await pdfParse(buffer, {
            pagerender: renderPage,
            max: 0, // process all pages
            version: "v1.10.100",
          });

          resumeText = data.text;

          console.log("PDF-parse extracted text length:", resumeText.length);
          console.log("Number of pages:", data.numpages);

          if (!resumeText || resumeText.trim().length < 10) {
            throw new Error(
              "PDF appears to be empty or contains no extractable text",
            );
          }

          // Clean up the extracted text
          resumeText = resumeText
            .replace(/\r\n/g, "\n") // Normalize line endings
            .replace(/\r/g, "\n") // Handle old Mac line endings
            .replace(/\n{3,}/g, "\n\n") // Limit consecutive newlines
            .replace(/\t/g, " ") // Replace tabs with spaces
            .replace(/[^\x20-\x7E\n]/g, " ") // Replace non-printable chars except newlines
            .replace(/\s+/g, " ") // Normalize multiple spaces
            .replace(/\n\s+/g, "\n") // Remove spaces at start of lines
            .replace(/\s+\n/g, "\n") // Remove spaces at end of lines
            .trim();

          console.log("Final cleaned text length:", resumeText.length);
          console.log(
            "Text preview (first 200 chars):",
            resumeText.substring(0, 200),
          );

          console.log(
            "PDF text extracted successfully, length:",
            resumeText.length,
          );
        } catch (pdfError) {
          console.error("PDF processing error:", pdfError);
          return NextResponse.json(
            {
              error:
                pdfError instanceof Error
                  ? pdfError.message
                  : "Failed to process PDF file",
            },
            { status: 400 },
          );
        }
      } else if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.toLowerCase().endsWith(".docx")
      ) {
        try {
          console.log("Processing DOCX file...");
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          resumeText = result.value;

          if (!resumeText || resumeText.trim().length < 10) {
            throw new Error(
              "DOCX appears to be empty or contains no extractable text",
            );
          }

          console.log(
            "DOCX text extracted successfully, length:",
            resumeText.length,
          );
        } catch (docxError) {
          console.error("DOCX processing error:", docxError);
          return NextResponse.json(
            {
              error:
                docxError instanceof Error
                  ? docxError.message
                  : "Failed to process DOCX file",
            },
            { status: 400 },
          );
        }
      } else {
        return NextResponse.json(
          {
            error:
              "Unsupported file type. Please upload PDF or DOCX files only.",
          },
          { status: 400 },
        );
      }
    } else if (textContent) {
      resumeText = textContent;
      console.log("Using provided text content, length:", resumeText.length);
    } else {
      return NextResponse.json(
        { error: "Please provide either a file or text content" },
        { status: 400 },
      );
    }

    if (!resumeText.trim()) {
      return NextResponse.json(
        { error: "No text content found in the uploaded file" },
        { status: 400 },
      );
    }

    // Write extracted text to file BEFORE OpenAI processing for debugging
    try {
      const fs = await import("fs/promises");
      const preProcessingData = {
        timestamp: new Date().toISOString(),
        fileName: file?.name || "text-input",
        extractedTextLength: resumeText.length,
        fullExtractedText: resumeText,
        textPreview: resumeText.substring(0, 500),
        fileSize: file?.size || 0,
        fileType: file?.type || "text",
      };

      await fs.writeFile(
        "./extracted-text-debug.json",
        JSON.stringify(preProcessingData, null, 2),
      );
      console.log("Raw extracted text written to extracted-text-debug.json");
    } catch (writeError) {
      console.log("Could not write pre-processing debug file:", writeError);
    }

    // Parse resume using OpenAI with ATS optimization focus
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert ATS (Applicant Tracking System) consultant and resume parser. Parse the resume with extreme attention to preserving the EXACT work history details. Focus on:

1. EXACT PRESERVATION: Keep company names, job titles, and dates exactly as written
2. WORK HISTORY ACCURACY: Parse employment dates precisely, noting current vs past roles
3. ACHIEVEMENT EXTRACTION: Find quantifiable accomplishments with specific numbers/metrics
4. SKILLS CATEGORIZATION: Separate technical skills, soft skills, and certifications accurately
5. CONTEXT PRESERVATION: Maintain the original context and meaning of all information

CRITICAL PARSING REQUIREMENTS:
- Extract company names EXACTLY as they appear in the resume
- Extract job titles EXACTLY as they appear in the resume  
- Extract employment dates EXACTLY as written (preserve format: "Jan 2020 - Dec 2022", "2020-2022", etc.)
- If multiple jobs at same company, list each role separately
- Focus on ACCURACY over standardization - preserve original text
- Pay special attention to employment chronology and overlapping dates
- For CURRENT ROLES: Set endDate to null/undefined, isCurrentRole to true
- For PAST ROLES: Include proper endDate, isCurrentRole to false
- DESCRIPTION MUST INCLUDE ALL BULLETS: For each job, capture EVERY bullet point, achievement, and responsibility line. Do NOT truncate or summarize. Each bullet should be on its own line prefixed with "- ". If a job has 8 bullets, all 8 must appear in the description field.
- EXTRACT PROJECTS: If the resume includes a Projects section or project-style entries, capture them separately in a top-level "projects" array instead of folding them into work experience when possible.

Return JSON with this exact structure:
{
  "summary": "Professional summary with skills and achievements",
  "skills": ["relevant technical/industry keywords"],
  "experience": [
    {
      "company": "Company Name (extract exact company name)",
      "role": "Job Title (extract exact title, not modified)",
      "startDate": "MM/YYYY (start date only)",
      "endDate": "MM/YYYY for past roles, null for current roles",
      "duration": "Full duration string as written in resume",
      "location": "City, State (if mentioned)",
      "description": "COMPLETE job description including ALL bullet points, achievements, and responsibilities. Include EVERY line item from the resume - do NOT summarize or truncate. Preserve each bullet as a separate line prefixed with '- '. This is critical: capture the FULL text, not just the first bullet.",
      "keywords": ["relevant technical/industry keywords"],
      "isCurrentRole": true for current roles, false for past roles
    }
  ],
  "projects": [
    {
      "company": "Project organization/client if explicitly stated, otherwise empty string",
      "role": "Project name or project title exactly as written",
      "startDate": "MM/YYYY if available",
      "endDate": "MM/YYYY if available, otherwise null",
      "duration": "Full project duration string as written in resume",
      "location": "Location if mentioned",
      "description": "COMPLETE project description including ALL bullet points. Preserve each bullet as a separate line prefixed with '- '.",
      "keywords": ["relevant technical/project keywords"],
      "isCurrentRole": true if ongoing, false otherwise
    }
  ],
  "education": [
    {
      "institution": "University/School Name",
      "degree": "Full Degree Name",
      "field": "Field of Study",
      "year": "YYYY",
      "gpa": "X.X if mentioned",
      "honors": "Honors/Dean's List if mentioned"
    }
  ],
  "contact": {
    "name": "Full Name",
    "firstName": "First Name",
    "lastName": "Last Name",
    "email": "extracted email",
    "phone": "extracted phone",
    "location": "City, State",
    "linkedin": "https://linkedin.com/in/yourprofile",
    "github": "https://github.com",
    "website": "yourportfolio.com"
  },
  "ats_score": "1-100 rating of ATS compatibility",
  "ats_recommendations": ["Specific suggestions to improve ATS compatibility"]
}`,
        },
        {
          role: "user",
          content: `Parse this resume text - IGNORE any metadata/artifacts like ICC_PROFILE, font information, or PDF formatting data. Focus only on actual resume content:\n\n${resumeText}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const parsedData = JSON.parse(
      completion.choices[0].message.content || "{}",
    );

    // Save the actual parsed JSON from OpenAI
    try {
      const fs = await import("fs/promises");
      const aiParsedData = {
        timestamp: new Date().toISOString(),
        fileName: file?.name || "text-input",
        openaiRawResponse: completion.choices[0].message.content,
        parsedJSON: parsedData,
        model: "gpt-4o",
        processingTime: Date.now(),
      };

      await fs.writeFile(
        "./openai-parsed-data.json",
        JSON.stringify(aiParsedData, null, 2),
      );
      console.log("OpenAI parsed data written to openai-parsed-data.json");
    } catch (writeError) {
      console.log("Could not write OpenAI parsed data file:", writeError);
    }

    // Log parsing results for debugging
    console.log("=== PARSING DEBUG ===");
    console.log("Resume text length:", resumeText.length);
    console.log("Resume text preview:", resumeText.substring(0, 500));
    console.log("Parsed experience count:", parsedData.experience?.length || 0);
    if (parsedData.experience?.length > 0) {
      console.log(
        "First experience:",
        JSON.stringify(parsedData.experience[0], null, 2),
      );
    }
    console.log("=== END DEBUG ===");

    // Write parsing results to a file for inspection
    try {
      const fs = await import("fs/promises");
      const debugData = {
        timestamp: new Date().toISOString(),
        fileName: file?.name || "text-input",
        extractedTextLength: resumeText.length,
        extractedTextPreview: resumeText.substring(0, 1000),
        parsedData: parsedData,
        rawTextSample: resumeText.substring(0, 2000),
      };

      await fs.writeFile(
        "./parsing-debug.json",
        JSON.stringify(debugData, null, 2),
      );
      console.log("Debug data written to parsing-debug.json");
    } catch (writeError) {
      console.log("Could not write debug file:", writeError);
    }

    const session = await getSessionFromRequest(request).catch(() => null);
    const userId = session?.user?.id || null;
    const resumeId =
      typeof requestedResumeId === "string" && requestedResumeId.trim()
        ? requestedResumeId.trim()
        : createResumeId();
    const versionId = createResumeVersionId();

    // Store original and parsed artifacts in canonical GCS layout
    let storageUrl = null;
    let originalFileKey = null;
    let parsedFileKey = null;

    if (file && userId) {
      try {
        originalFileKey = buildOriginalResumeKey(userId, resumeId, versionId, file.name);
        parsedFileKey = buildParsedResumeKey(userId, resumeId, versionId);
        const fileBuffer = await file.arrayBuffer();
        await saveResumeObject({
          key: originalFileKey,
          body: Buffer.from(fileBuffer),
          contentType: file.type || "application/octet-stream",
          metadata: {
            userId,
            resumeId,
            versionId,
            versionType: "original",
            fileName: file.name,
            uploadedAt: new Date().toISOString(),
          },
        });
        await saveResumeObject({
          key: parsedFileKey,
          body: JSON.stringify(parsedData, null, 2),
          contentType: "application/json",
          metadata: {
            userId,
            resumeId,
            versionId,
            versionType: "parsed",
            originalKey: originalFileKey,
            fileName: file.name,
            uploadedAt: new Date().toISOString(),
          },
        });
        storageUrl = toGcsUrl(originalFileKey);
      } catch (storageError) {
        console.warn("Resume storage failed, continuing without storage:", storageError);
      }
    }

    // Store both original PDF and parsed JSON data to S3
    // The parsed data is also returned to the frontend for immediate use

    // Convert date strings to Date objects for proper frontend handling
    const parseDate = (dateStr: string | undefined): Date | undefined => {
      if (!dateStr) return undefined;
      
      // Handle various date formats from OpenAI
      if (dateStr.match(/^\d{4}$/)) {
        // Just year like "2024"
        return new Date(parseInt(dateStr), 0, 1); // January 1st of that year
      }
      
      if (dateStr.match(/^\d{2}\/\d{4}$/)) {
        // MM/YYYY format
        const [month, year] = dateStr.split('/');
        return new Date(parseInt(year), parseInt(month) - 1, 1);
      }
      
      if (dateStr.match(/^\d{4}-\d{2}$/)) {
        // YYYY-MM format
        const [year, month] = dateStr.split('-');
        return new Date(parseInt(year), parseInt(month) - 1, 1);
      }
      
      // Try to parse as normal date
      const parsed = new Date(dateStr);
      return isNaN(parsed.getTime()) ? undefined : parsed;
    };

    const processedData = {
      ...parsedData,
      experience: parsedData.experience?.map((exp: any) => ({
        ...exp,
        startDate: parseDate(exp.startDate),
        endDate: parseDate(exp.endDate),
      })) || [],
      projects: parsedData.projects?.map((project: any) => ({
        ...project,
        startDate: parseDate(project.startDate),
        endDate: parseDate(project.endDate),
      })) || [],
    };

    let knowledgeIndexed = false;

    try {
      if (userId) {
        await ingestWorkExperienceResume({
          userId,
          resumeId,
          fileName: file?.name || "text-input",
          fileContent: resumeText,
          parsedData:
            processedData && typeof processedData === "object"
              ? (processedData as Record<string, unknown>)
              : null,
        });
        knowledgeIndexed = true;
      }
    } catch (ingestError) {
      console.warn("Work experience indexing skipped:", ingestError);
    }

    return NextResponse.json({
      success: true,
      data: processedData,
      fileName: file?.name || "text-input",
      fileContent: resumeText,
      parsedData: processedData,
      s3Url: storageUrl,
      storageUrl,
      originalFileKey,
      parsedFileKey,
      resumeId,
      versionId,
      saved: true,
      knowledgeIndexed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Resume upload error:", error);

    // Handle specific error types
    if (error instanceof Error && error.message.includes("JSON")) {
      return NextResponse.json(
        {
          error:
            "Failed to parse resume data. Please try again with a different format.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to process resume. Please try again or contact support.",
      },
      { status: 500 },
    );
  }
}
