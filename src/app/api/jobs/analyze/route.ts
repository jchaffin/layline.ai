import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/api/openai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    let parsedBody;

    try {
      parsedBody = JSON.parse(body);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON format in request body" },
        { status: 400 }
      );
    }

    const { description, url, jobDescription } = parsedBody;

    let jobDescriptionText = description || jobDescription;

    if (url && !jobDescriptionText) {
      try {
        const fetchResponse = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        });

        if (!fetchResponse.ok) {
          throw new Error(`HTTP ${fetchResponse.status}`);
        }

        const htmlContent = await fetchResponse.text();

        if (
          url.includes("linkedin.com/jobs/search") &&
          url.includes("currentJobId")
        ) {
          const jobIdMatch = url.match(/currentJobId=(\d+)/);
          if (jobIdMatch) {
            const jobId = jobIdMatch[1];
            const jobTitleMatch = htmlContent.match(
              /<h3[^>]*>([^<]+)<\/h3>/gi
            );
            const companyMatch = htmlContent.match(
              /<h4[^>]*>([^<]+)<\/h4>/gi
            );
            const locationMatch = htmlContent.match(
              /([A-Za-z\s,]+),\s*[A-Z]{2}\s*\d+\s*hours?\s*ago/gi
            );

            if (jobTitleMatch && jobTitleMatch.length > 0) {
              const jobTitle = jobTitleMatch[0]
                .replace(/<[^>]*>/g, "")
                .trim();
              const company =
                companyMatch && companyMatch.length > 0
                  ? companyMatch[0].replace(/<[^>]*>/g, "").trim()
                  : "Company not specified";
              const location =
                locationMatch && locationMatch.length > 0
                  ? locationMatch[0].replace(/<[^>]*>/g, "").trim()
                  : "Location not specified";

              jobDescriptionText = `
Job Title: ${jobTitle}
Company: ${company}
Location: ${location}
Job ID: ${jobId}

This job was extracted from LinkedIn search results. For a complete job description, please visit the original LinkedIn posting or copy the full job description manually.

To get the full job details, please:
1. Click on the job title on LinkedIn
2. Copy the complete job description
3. Paste it into the job analysis form
              `.trim();
            }
          }
        }

        if (!jobDescriptionText) {
          const textContent = htmlContent
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim();

          if (textContent.length < 100) {
            throw new Error("Insufficient content extracted");
          }

          jobDescriptionText = textContent;
        }
      } catch {
        return NextResponse.json(
          {
            error:
              "Could not fetch job description from URL. Please copy and paste the job description manually.",
          },
          { status: 400 }
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
  "keywords": ["keyword1", "keyword2"],
  "sentiment": 0.8
}`,
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

    return NextResponse.json({
      description: cleanDescription,
      url: url || undefined,
      analysis,
    });
  } catch (error) {
    console.error("Job analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze job description" },
      { status: 500 }
    );
  }
}
