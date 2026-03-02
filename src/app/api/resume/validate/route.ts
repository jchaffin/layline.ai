import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { parsedData, originalText } = await request.json();

    if (!parsedData || !originalText) {
      return NextResponse.json({ error: 'Missing parsed data or original text' }, { status: 400 });
    }

    const validationIssues: string[] = [];

    // Validate work experience parsing
    if (parsedData.experience && Array.isArray(parsedData.experience)) {
      for (let i = 0; i < parsedData.experience.length; i++) {
        const exp = parsedData.experience[i];
        
        // Check for missing required fields
        if (!exp.company) validationIssues.push(`Experience ${i + 1}: Missing company name`);
        if (!exp.role) validationIssues.push(`Experience ${i + 1}: Missing job title`);
        if (!exp.duration && !exp.startDate) validationIssues.push(`Experience ${i + 1}: Missing duration/dates`);
        
        // Check if company name seems reasonable (not just placeholder)
        if (exp.company && (exp.company.includes('Company Name') || exp.company.length < 2)) {
          validationIssues.push(`Experience ${i + 1}: Company name seems invalid: "${exp.company}"`);
        }
        
        // Check if role seems reasonable
        if (exp.role && (exp.role.includes('Job Title') || exp.role.includes('Exact'))) {
          validationIssues.push(`Experience ${i + 1}: Job title seems invalid: "${exp.role}"`);
        }
        
        // Check date format consistency
        if (exp.duration && exp.duration.includes('MM/YYYY')) {
          validationIssues.push(`Experience ${i + 1}: Duration not properly parsed: "${exp.duration}"`);
        }
      }
    } else {
      validationIssues.push('No work experience found or invalid format');
    }

    // Validate skills
    if (!parsedData.skills || !parsedData.skills.technical) {
      validationIssues.push('No technical skills found');
    }

    // Validate contact info
    if (!parsedData.contact || !parsedData.contact.email) {
      validationIssues.push('No email address found');
    }

    return NextResponse.json({
      isValid: validationIssues.length === 0,
      issues: validationIssues,
      suggestions: validationIssues.length > 0 ? [
        'Try uploading the resume again',
        'Ensure the resume has clear work experience section',
        'Check that company names and job titles are clearly formatted'
      ] : []
    });

  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate parsed data' },
      { status: 500 }
    );
  }
}