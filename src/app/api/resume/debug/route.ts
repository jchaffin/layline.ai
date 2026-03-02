import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { resumeText } = await request.json();

    if (!resumeText) {
      return NextResponse.json({ error: 'Resume text is required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // Debug parsing - extract raw work experience sections first
    const debugCompletion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a resume parsing expert. Extract the work experience section EXACTLY as written in the resume text. 

Return JSON with this structure:
{
  "workExperienceSection": "The exact text of the work experience/employment section",
  "identifiedJobs": [
    {
      "rawText": "The exact text for this job entry",
      "companyName": "Company name as written",
      "jobTitle": "Job title as written", 
      "dates": "Dates as written",
      "location": "Location if mentioned"
    }
  ],
  "parsingNotes": "Any observations about the format or structure"
}

Focus on extracting information EXACTLY as written, without any modifications or standardization.`
        },
        {
          role: 'user',
          content: `Extract work experience from this resume:\n\n${resumeText}`
        }
      ],
      response_format: { type: 'json_object' },
    });

    const debugData = JSON.parse(debugCompletion.choices[0].message.content || '{}');

    // Now do the standard parsing
    const standardCompletion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert resume parser. Parse work experience with absolute precision.

CRITICAL RULES:
1. Extract company names EXACTLY as written - no modifications
2. Extract job titles EXACTLY as written - no modifications  
3. Extract dates EXACTLY as written - preserve original format
4. If dates are unclear, extract them as written and note in parsing
5. Focus on accuracy over standardization

Return JSON:
{
  "experience": [
    {
      "company": "Exact company name",
      "role": "Exact job title", 
      "startDate": "Start date exactly as written",
      "endDate": "End date exactly as written",
      "duration": "Full date range as written",
      "location": "Location if mentioned",
      "achievements": ["Achievement 1", "Achievement 2"],
      "responsibilities": ["Responsibility 1", "Responsibility 2"],
      "isCurrentRole": true/false
    }
  ]
}`
        },
        {
          role: 'user',
          content: `Parse work experience from:\n\n${resumeText}`
        }
      ],
      response_format: { type: 'json_object' },
    });

    const standardData = JSON.parse(standardCompletion.choices[0].message.content || '{}');

    return NextResponse.json({
      debugExtraction: debugData,
      standardParsing: standardData,
      originalText: resumeText.substring(0, 2000) + (resumeText.length > 2000 ? '...' : '')
    });

  } catch (error) {
    console.error('Debug parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to debug parse resume' },
      { status: 500 }
    );
  }
}