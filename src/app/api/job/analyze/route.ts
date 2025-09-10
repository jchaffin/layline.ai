import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    let parsedBody;
    
    try {
      parsedBody = JSON.parse(body);
      console.log('Received request body:', parsedBody);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON format in request body' },
        { status: 400 }
      );
    }
    
    const { description, url, jobDescription } = parsedBody;

    let jobDescriptionText = description || jobDescription;

    // If URL is provided but no description, try to fetch from URL
    if (url && !jobDescriptionText) {
      console.log('Attempting to fetch job description from URL:', url);
      try {
        const fetchResponse = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (!fetchResponse.ok) {
          throw new Error(`HTTP ${fetchResponse.status}`);
        }
        
        const htmlContent = await fetchResponse.text();
        
        // Check if this is a LinkedIn search page with currentJobId
        if (url.includes('linkedin.com/jobs/search') && url.includes('currentJobId')) {
          console.log('Detected LinkedIn search page with currentJobId, attempting to extract specific job');
          
          // Try to extract the specific job from the search results
          const jobIdMatch = url.match(/currentJobId=(\d+)/);
          if (jobIdMatch) {
            const jobId = jobIdMatch[1];
            console.log('Extracted job ID:', jobId);
            
            // Look for job information in the HTML content
            const jobTitleMatch = htmlContent.match(/<h3[^>]*>([^<]+)<\/h3>/gi);
            const companyMatch = htmlContent.match(/<h4[^>]*>([^<]+)<\/h4>/gi);
            const locationMatch = htmlContent.match(/([A-Za-z\s,]+),\s*[A-Z]{2}\s*\d+\s*hours?\s*ago/gi);
            
            if (jobTitleMatch && jobTitleMatch.length > 0) {
              const jobTitle = jobTitleMatch[0].replace(/<[^>]*>/g, '').trim();
              const company = companyMatch && companyMatch.length > 0 ? companyMatch[0].replace(/<[^>]*>/g, '').trim() : 'Company not specified';
              const location = locationMatch && locationMatch.length > 0 ? locationMatch[0].replace(/<[^>]*>/g, '').trim() : 'Location not specified';
              
              // Create a structured job description
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
              
              console.log('Extracted job info:', { jobTitle, company, location, jobId });
            }
          }
        }
        
        // If we don't have job description yet, fall back to general text extraction
        if (!jobDescriptionText) {
          // Simple text extraction - remove HTML tags and get clean text
          const textContent = htmlContent
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          if (textContent.length < 100) {
            throw new Error('Insufficient content extracted');
          }
          
          jobDescriptionText = textContent;
        }
        
        console.log('Successfully extracted job description from URL, length:', jobDescriptionText.length);
        
      } catch (fetchError) {
        console.error('Failed to fetch from URL:', fetchError);
        return NextResponse.json(
          { error: 'Could not fetch job description from URL. Please copy and paste the job description manually.' },
          { status: 400 }
        );
      }
    }

    if (!jobDescriptionText || jobDescriptionText.trim() === '') {
      console.log('Missing job description, received:', { description, jobDescription, parsedBody });
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      );
    }

    // Clean the job description text to remove control characters
    const cleanDescription = jobDescriptionText.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ').trim();
    
    console.log('Analyzing job description, length:', cleanDescription.length);

    // Analyze job description using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: 'system',
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
          role: 'user',
          content: `Analyze this job description and extract all relevant information:\n\n${cleanDescription}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');
    
    console.log('Job analysis completed:', analysis);

    return NextResponse.json({
      description: cleanDescription,
      url: url || undefined,
      analysis,
    });
  } catch (error) {
    console.error('Job analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze job description' },
      { status: 500 }
    );
  }
}