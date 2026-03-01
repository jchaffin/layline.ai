import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const urlSchema = z.object({
  url: z.string().url(),
});

// Mock job extraction - in a real app, this would use web scraping or APIs
async function extractJobFromUrl(url: string) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Extract domain for company name guess
  const domain = new URL(url).hostname.replace('www.', '');
  const companyGuess = domain.split('.')[0];
  
  // Mock job data based on URL patterns
  if (url.includes('linkedin.com')) {
    return {
      title: "Software Engineer",
      company: "LinkedIn",
      location: "Remote",
      salary: "$120,000 - $180,000",
      description: "We are looking for a talented Software Engineer to join our team. You will be responsible for developing high-quality software solutions and collaborating with cross-functional teams to deliver exceptional products."
    };
  } else if (url.includes('google.com') || url.includes('alphabet.com')) {
    return {
      title: "Senior Software Engineer",
      company: "Google",
      location: "Mountain View, CA",
      salary: "$150,000 - $250,000",
      description: "Join Google's engineering team to work on products that impact billions of users. We're looking for experienced engineers who can solve complex technical challenges at scale."
    };
  } else if (url.includes('microsoft.com')) {
    return {
      title: "Principal Software Engineer",
      company: "Microsoft",
      location: "Seattle, WA",
      salary: "$140,000 - $220,000",
      description: "Microsoft is seeking a Principal Software Engineer to lead technical initiatives and mentor engineering teams in building next-generation cloud solutions."
    };
  } else if (url.includes('amazon.com')) {
    return {
      title: "Software Development Engineer",
      company: "Amazon",
      location: "Seattle, WA / Remote",
      salary: "$130,000 - $200,000",
      description: "Amazon is looking for a Software Development Engineer to build and maintain large-scale distributed systems that power our e-commerce platform."
    };
  } else {
    // Generic extraction for other URLs
    return {
      title: "Software Engineer",
      company: companyGuess.charAt(0).toUpperCase() + companyGuess.slice(1),
      location: "Remote",
      salary: "$80,000 - $150,000",
      description: `Exciting opportunity to join ${companyGuess} as a Software Engineer. Work on innovative projects and contribute to cutting-edge technology solutions.`
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = urlSchema.parse(body);
    
    // Extract job information from URL
    const jobData = await extractJobFromUrl(url);
    
    return NextResponse.json(jobData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid URL format', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error fetching job from URL:', error);
    return NextResponse.json(
      { error: 'Failed to extract job information from URL' },
      { status: 500 }
    );
  }
}