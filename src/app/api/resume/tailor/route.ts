import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getSessionFromRequest } from '@/lib/api/auth';
import {
  buildTailoredResumeKey,
  createResumeId,
  createResumeVersionId,
  parseResumeStorageKey,
  saveResumeObject,
  toGcsUrl,
} from '@/lib/resumeStorage';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { resumeData, jobDescription, companyName, roleTitle, originalKey } = await request.json();

    if (!resumeData || !jobDescription) {
      return NextResponse.json(
        { error: 'Resume data and job description are required' },
        { status: 400 }
      );
    }

    // Generate tailored resume using AI
    const tailoredResume = await openai.chat.completions.create({
      model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: 'system',
          content: `You are an expert resume writer and career consultant. Tailor the provided resume to perfectly match the job description while maintaining truthfulness and accuracy.

TAILORING GUIDELINES:
1. Rewrite the professional summary to align with the job requirements
2. Reorder and emphasize relevant skills based on job priorities
3. Rephrase experience descriptions using job description keywords
4. Quantify achievements that matter most for this role
5. Highlight relevant projects and technologies
6. Optimize for ATS compatibility with job-specific keywords
7. Maintain all factual information - only change presentation and emphasis

Return JSON with the same structure as the input resume but optimized for the specific job:
{
  "summary": "Tailored professional summary with job-specific keywords",
  "skills": {
    "technical": ["reordered and emphasized technical skills"],
    "soft": ["relevant soft skills for the role"],
    "certifications": ["prioritized certifications"]
  },
  "experience": [
    {
      "company": "Same company name",
      "role": "Same role title",
      "duration": "Same duration", 
      "location": "Same location",
      "achievements": ["Rephrased achievements emphasizing job-relevant metrics"],
      "responsibilities": ["Rewritten responsibilities using job keywords"],
      "keywords": ["Enhanced keywords matching job requirements"]
    }
  ],
  "education": ["Same education but emphasized relevant aspects"],
  "contact": "Same contact information",
  "ats_score": "Improved ATS score",
  "ats_recommendations": ["Updated recommendations"],
  "tailoring_notes": {
    "keyChanges": ["Summary rewritten for X role", "Emphasized Y skills"],
    "keywordsAdded": ["keyword1", "keyword2"],
    "focusAreas": ["technical leadership", "cloud architecture"]
  }
}`,
        },
        {
          role: 'user',
          content: `Tailor this resume for the specific job:

COMPANY: ${companyName || 'Target Company'}
ROLE: ${roleTitle || 'Target Role'}

ORIGINAL RESUME:
${JSON.stringify(resumeData, null, 2)}

JOB DESCRIPTION:
${jobDescription}

Create a perfectly tailored version that maximizes match percentage while staying truthful.`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const tailoredData = JSON.parse(tailoredResume.choices[0].message.content || '{}');

    // Generate resume document (simplified - could be enhanced with proper formatting)
    const resumeDocument = generateResumeDocument(tailoredData, companyName, roleTitle);
    
    const session = await getSessionFromRequest(request).catch(() => null);
    const userId = session?.user?.id || null;
    const parsedOriginal = typeof originalKey === 'string' ? parseResumeStorageKey(originalKey) : null;
    const resumeId = parsedOriginal?.resumeId || createResumeId();
    const versionId = createResumeVersionId();

    let storageUrl = null;
    let storageKey = null;
    if (userId) {
      try {
        storageKey = buildTailoredResumeKey(userId, resumeId, versionId);
        
        const storedData = {
          companyName: companyName || 'Unknown Company',
          roleTitle: roleTitle || 'Unknown Role',
          createdAt: new Date().toISOString(),
          originalKey: originalKey || null,
          resumeId,
          versionId,
          originalResume: resumeData,
          tailoredResume: tailoredData,
          jobDescription: jobDescription,
          document: generateResumeDocument(tailoredData, companyName, roleTitle)
        };

        await saveResumeObject({
          key: storageKey,
          body: JSON.stringify(storedData, null, 2),
          contentType: 'application/json',
          metadata: {
            userId,
            resumeId,
            versionId,
            versionType: 'tailored',
            company: companyName || 'unknown',
            role: roleTitle || 'unknown',
            originalKey: originalKey || undefined,
            label: roleTitle || 'Tailored Resume',
            createdAt: storedData.createdAt,
          },
        });
        storageUrl = toGcsUrl(storageKey);
      } catch (storageError) {
        console.warn('Resume storage failed, continuing without storage:', storageError);
      }
    }

    return NextResponse.json({
      success: true,
      tailoredResume: tailoredData,
      document: resumeDocument,
      s3Url: storageUrl,
      storageUrl,
      storageKey,
      resumeId,
      versionId,
      metadata: {
        companyName,
        roleTitle,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Resume tailoring error:', error);
    return NextResponse.json(
      { error: 'Failed to tailor resume' },
      { status: 500 }
    );
  }
}

function generateResumeDocument(resumeData: any, companyName?: string, roleTitle?: string): string {
  // Generate a formatted resume document
  const doc = [];
  
  // Header
  if (resumeData.contact) {
    doc.push(`${resumeData.contact.email || ''}`);
    doc.push(`${resumeData.contact.phone || ''} | ${resumeData.contact.location || ''}`);
    
    // Professional links
    const links = [];
    if (resumeData.contact.linkedin) links.push(`LinkedIn: ${resumeData.contact.linkedin}`);
    if (resumeData.contact.github) links.push(`GitHub: ${resumeData.contact.github}`);
    if (resumeData.contact.website) links.push(`Portfolio: ${resumeData.contact.website}`);
    
    if (links.length > 0) {
      doc.push(links.join(' | '));
    }
    doc.push('');
  }

  // Professional Summary
  if (resumeData.summary) {
    doc.push('PROFESSIONAL SUMMARY');
    doc.push(resumeData.summary);
    doc.push('');
  }

  // Skills
  if (resumeData.skills) {
    doc.push('SKILLS');
    if (resumeData.skills.technical?.length) {
      doc.push(`Technical Skills: ${resumeData.skills.technical.join(', ')}`);
    }
    if (resumeData.skills.soft?.length) {
      doc.push(`Core Competencies: ${resumeData.skills.soft.join(', ')}`);
    }
    if (resumeData.skills.certifications?.length) {
      doc.push(`Certifications: ${resumeData.skills.certifications.join(', ')}`);
    }
    doc.push('');
  }

  // Experience
  if (resumeData.experience?.length) {
    doc.push('PROFESSIONAL EXPERIENCE');
    resumeData.experience.forEach((exp: any) => {
      doc.push(`${exp.role} | ${exp.company} | ${exp.duration}`);
      if (exp.location) doc.push(`Location: ${exp.location}`);
      
      if (exp.achievements?.length) {
        doc.push('Key Achievements:');
        exp.achievements.forEach((achievement: string) => {
          doc.push(`• ${achievement}`);
        });
        doc.push(''); // Add spacing after achievements
      }
      
      if (exp.responsibilities?.length) {
        doc.push('Responsibilities:');
        exp.responsibilities.forEach((resp: string) => {
          doc.push(`• ${resp}`);
        });
        doc.push(''); // Add spacing after responsibilities
      }
      doc.push('');
    });
  }

  // Education
  if (resumeData.education?.length) {
    doc.push('EDUCATION');
    resumeData.education.forEach((edu: any) => {
      doc.push(`${edu.degree} | ${edu.institution} | ${edu.year}`);
      if (edu.field) doc.push(`Field of Study: ${edu.field}`);
      if (edu.gpa) doc.push(`GPA: ${edu.gpa}`);
      if (edu.honors) doc.push(`Honors: ${edu.honors}`);
      doc.push('');
    });
  }

  return doc.join('\n');
}