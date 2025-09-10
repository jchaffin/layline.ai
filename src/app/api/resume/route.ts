import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  const id = searchParams.get('id');

  switch (action) {
    case 'list':
      return handleList();
    case 'parsed':
      return handleParsed(id);
    case 'preview':
      return handlePreview(id);
    case 'download':
      return handleDownload(id);
    case 'pdf-image':
      return handlePdfImage(id);
    case 'debug-parsing':
      return handleDebugParsing(id);
    case 'validate-parsing':
      return handleValidateParsing(id);
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  if (action === 'upload') {
    return handleUpload(request);
  }

  // For other actions that expect JSON body
  try {
    const body = await request.json();
    const { action: bodyAction } = body;

    switch (bodyAction) {
      case 'match':
        return handleMatch(body);
      case 'tailor':
        return handleTailor(body);
      case 'improve':
        return handleImprove(body);
      case 'generate-pdf':
        return handleGeneratePdf(body);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }
  
  return handleDelete(id);
}

// Handler functions
async function handleList() {
  // Placeholder for list logic
  return NextResponse.json({ resumes: [] });
}

async function handleParsed(id: string | null) {
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }
  // Placeholder for parsed logic
  return NextResponse.json({ parsed: {} });
}

async function handlePreview(id: string | null) {
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }
  // Placeholder for preview logic
  return NextResponse.json({ preview: {} });
}

async function handleDownload(id: string | null) {
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }
  // Placeholder for download logic
  return NextResponse.json({ download: {} });
}

async function handlePdfImage(id: string | null) {
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }
  // Placeholder for pdf-image logic
  return NextResponse.json({ image: {} });
}

async function handleDebugParsing(id: string | null) {
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }
  // Placeholder for debug-parsing logic
  return NextResponse.json({ debug: {} });
}

async function handleValidateParsing(id: string | null) {
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }
  // Placeholder for validate-parsing logic
  return NextResponse.json({ validation: {} });
}

async function handleUpload(request: NextRequest) {
  try {
    console.log("Resume upload request received");

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const textContent = formData.get('textContent') as string;
    
    if (!file && !textContent) {
      return NextResponse.json({ error: 'No file or text content provided' }, { status: 400 });
    }

    console.log("File:", file?.name, "TextContent length:", textContent?.length);

    let resumeText = "";

    if (file) {
      console.log("Processing file:", file.name, "Type:", file.type, "Size:", file.size);

      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        try {
          console.log("Using pdf-parse library for text extraction");

          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Import pdf-parse dynamically
          const pdfParse = (await import("@jchaffin/pdf-parse")).default;

          // Custom render function for better text extraction
          function renderPage(pageData: any) {
            const renderOptions = {
              normalizeWhitespace: true,
              disableCombineTextItems: false,
            };

            return pageData.getTextContent(renderOptions).then(function (textContent: any) {
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

          const data = await pdfParse(buffer, {
            pagerender: renderPage,
            max: 0,
            version: "v1.10.100",
          });

          resumeText = data.text;

          console.log("PDF-parse extracted text length:", resumeText.length);

          if (!resumeText || resumeText.trim().length < 10) {
            throw new Error("PDF appears to be empty or contains no extractable text");
          }

          // Clean up the extracted text
          resumeText = resumeText
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .replace(/\t/g, " ")
            .replace(/[^\x20-\x7E\n]/g, " ")
            .replace(/\s+/g, " ")
            .replace(/\n\s+/g, "\n")
            .replace(/\s+\n/g, "\n")
            .trim();

          console.log("PDF text extracted successfully, length:", resumeText.length);
        } catch (pdfError) {
          console.error("PDF processing error:", pdfError);
          return NextResponse.json({
            error: pdfError instanceof Error ? pdfError.message : "Failed to process PDF file"
          }, { status: 400 });
        }
      } else if (
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.toLowerCase().endsWith(".docx")
      ) {
        try {
          console.log("Processing DOCX file...");
          const arrayBuffer = await file.arrayBuffer();
          
          // Import mammoth dynamically
          const mammoth = await import("mammoth");
          const result = await mammoth.default.extractRawText({ arrayBuffer });
          resumeText = result.value;

          if (!resumeText || resumeText.trim().length < 10) {
            throw new Error("DOCX appears to be empty or contains no extractable text");
          }

          console.log("DOCX text extracted successfully, length:", resumeText.length);
        } catch (docxError) {
          console.error("DOCX processing error:", docxError);
          return NextResponse.json({
            error: docxError instanceof Error ? docxError.message : "Failed to process DOCX file"
          }, { status: 400 });
        }
      } else {
        return NextResponse.json({
          error: "Unsupported file type. Please upload PDF or DOCX files only."
        }, { status: 400 });
      }
    } else if (textContent) {
      resumeText = textContent;
      console.log("Using provided text content, length:", resumeText.length);
    }

    if (!resumeText.trim()) {
      return NextResponse.json({
        error: "No text content found in the uploaded file"
      }, { status: 400 });
    }

    // Parse resume using OpenAI
    const openai = new (await import("openai")).default({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert ATS (Applicant Tracking System) consultant and resume parser. Parse the resume with extreme attention to preserving the EXACT work history details and personal information. Focus on:

1. PERSONAL INFORMATION EXTRACTION: Extract the candidate's full name, email, phone, and location from the header/contact section
2. EXACT PRESERVATION: Keep company names, job titles, and dates exactly as written
3. WORK HISTORY ACCURACY: Parse employment dates precisely, noting current vs past roles
4. ACHIEVEMENT EXTRACTION: Find quantifiable accomplishments with specific numbers/metrics and extract them as bullet points
5. SKILLS CATEGORIZATION: Separate technical skills, soft skills, and certifications accurately
6. CONTEXT PRESERVATION: Maintain the original context and meaning of all information

CRITICAL PARSING REQUIREMENTS:
- EXTRACT THE CANDIDATE'S FULL NAME from the resume header/title area (usually at the top)
- Extract company names EXACTLY as they appear in the resume
- Extract job titles EXACTLY as they appear in the resume  
- Extract employment dates EXACTLY as written (preserve format: "Jan 2020 - Dec 2022", "2020-2022", etc.)
- If multiple jobs at same company, list each role separately
- Focus on ACCURACY over standardization - preserve original text
- Pay special attention to employment chronology and overlapping dates
- For CURRENT ROLES: Set endDate to null/undefined, isCurrentRole to true
- For PAST ROLES: Include proper endDate, isCurrentRole to false
- FORMAT JOB DESCRIPTIONS WITH BULLET POINTS: Include achievements and responsibilities as bullet points in the description field, with each bullet point on a new line

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
      "description": "Job Description with bullet points for achievements and responsibilities",
      "keywords": ["relevant technical/industry keywords"],
      "isCurrentRole": true for current roles, false for past roles
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
    "name": "FULL NAME OF THE CANDIDATE (extract from resume header)",
    "firstName": "First name only",
    "lastName": "Last name only", 
    "email": "extracted email address",
    "phone": "extracted phone number",
    "location": "City, State",
    "address": "Full address if provided",
    "linkedin": "https://linkedin.com/in/yourprofile",
    "github": "https://github.com/username",
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

    const parsedData = JSON.parse(completion.choices[0].message.content || "{}");

    // Convert date strings to Date objects for proper frontend handling
    const parseDate = (dateStr: string | undefined): Date | undefined => {
      if (!dateStr) return undefined;
      
      if (dateStr.match(/^\d{4}$/)) {
        return new Date(parseInt(dateStr), 0, 1);
      }
      
      if (dateStr.match(/^\d{2}\/\d{4}$/)) {
        const [month, year] = dateStr.split('/');
        return new Date(parseInt(year), parseInt(month) - 1, 1);
      }
      
      if (dateStr.match(/^\d{4}-\d{2}$/)) {
        const [year, month] = dateStr.split('-');
        return new Date(parseInt(year), parseInt(month) - 1, 1);
      }
      
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
    };

    console.log("=== PARSING DEBUG ===");
    console.log("Resume text length:", resumeText.length);
    console.log("Parsed experience count:", processedData.experience?.length || 0);
    console.log("Contact info:", processedData.contact);
    console.log("Name extracted:", processedData.contact?.name);
    console.log("Email extracted:", processedData.contact?.email);
    console.log("=== END DEBUG ===");

    return NextResponse.json({
      success: true,
      data: processedData,
      fileName: file?.name || "text-input",
      fileContent: resumeText,
      parsedData: processedData,
      saved: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Resume upload error:", error);

    if (error instanceof Error && error.message.includes("JSON")) {
      return NextResponse.json({
        error: "Failed to parse resume data. Please try again with a different format."
      }, { status: 400 });
    }

    return NextResponse.json({
      error: "Failed to process resume. Please try again or contact support."
    }, { status: 500 });
  }
}

async function handleMatch(body: any) {
  // Placeholder for match logic
  return NextResponse.json({ match: {} });
}

async function handleTailor(body: any) {
  // Placeholder for tailor logic
  return NextResponse.json({ tailored: {} });
}

async function handleImprove(body: any) {
  try {
    const { resumeData } = body;
    
    if (!resumeData) {
      return NextResponse.json({ error: 'Resume data is required' }, { status: 400 });
    }

    const openai = new (await import("openai")).default({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert ATS (Applicant Tracking System) consultant and resume optimization specialist. Your task is to improve the provided resume to make it more ATS-friendly and impactful.

IMPROVEMENT FOCUS AREAS:
1. ATS OPTIMIZATION: Add relevant keywords, improve formatting, and ensure ATS compatibility
2. CONTENT ENHANCEMENT: Strengthen achievements with quantifiable metrics and action verbs
3. SKILLS OPTIMIZATION: Add missing relevant skills and technologies
4. SUMMARY IMPROVEMENT: Create a compelling professional summary
5. EXPERIENCE ENHANCEMENT: Improve job descriptions with better bullet points and achievements

CRITICAL REQUIREMENTS:
- Maintain the original structure and information
- Add quantifiable achievements where possible (numbers, percentages, metrics)
- Use strong action verbs at the beginning of bullet points
- Include relevant industry keywords
- Ensure all improvements are factual and professional
- Preserve the candidate's voice and experience level

Return the improved resume data in the same JSON structure as the original, with enhanced content.`,
        },
        {
          role: "user",
          content: `Please improve this resume for better ATS compatibility and impact:\n\n${JSON.stringify(resumeData, null, 2)}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const improvedData = JSON.parse(completion.choices[0].message.content || "{}");

    // Convert date strings to Date objects for consistency
    const parseDate = (dateStr: string | undefined): Date | undefined => {
      if (!dateStr) return undefined;
      
      if (dateStr.match(/^\d{4}$/)) {
        return new Date(parseInt(dateStr), 0, 1);
      }
      
      if (dateStr.match(/^\d{2}\/\d{4}$/)) {
        const [month, year] = dateStr.split('/');
        return new Date(parseInt(year), parseInt(month) - 1, 1);
      }
      
      if (dateStr.match(/^\d{4}-\d{2}$/)) {
        const [year, month] = dateStr.split('-');
        return new Date(parseInt(year), parseInt(month) - 1, 1);
      }
      
      const parsed = new Date(dateStr);
      return isNaN(parsed.getTime()) ? undefined : parsed;
    };

    const processedData = {
      ...improvedData,
      experience: improvedData.experience?.map((exp: any) => ({
        ...exp,
        startDate: parseDate(exp.startDate),
        endDate: parseDate(exp.endDate),
      })) || [],
    };

    return NextResponse.json({
      success: true,
      data: processedData,
      message: "Resume improved successfully",
    });
  } catch (error) {
    console.error("Resume improvement error:", error);
    return NextResponse.json({
      error: "Failed to improve resume. Please try again."
    }, { status: 500 });
  }
}

async function handleGeneratePdf(body: any) {
  // Placeholder for generate-pdf logic
  return NextResponse.json({ pdf: {} });
}

async function handleDelete(id: string) {
  // Placeholder for delete logic
  return NextResponse.json({ success: true });
} 