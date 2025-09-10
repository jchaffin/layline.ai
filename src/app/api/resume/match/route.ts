import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { resumeData, jobDescription } = await request.json();

    if (!resumeData || !jobDescription) {
      return NextResponse.json(
        { error: 'Resume data and job description are required' },
        { status: 400 }
      );
    }

    // Debug: Log resume data structure
    console.log('Resume data structure:', {
      hasExperience: !!resumeData.experience,
      experienceLength: resumeData.experience?.length || 0,
      experienceType: typeof resumeData.experience,
      firstExperience: resumeData.experience?.[0] || null
    });

    // Debug: Log the actual experience data
    if (resumeData.experience && Array.isArray(resumeData.experience)) {
      console.log('Raw experience data:', JSON.stringify(resumeData.experience, null, 2));
    }

    // Calculate total years of experience from resume data
    let totalYearsOfExperience = 0;
    if (resumeData.experience && Array.isArray(resumeData.experience)) {
      const now = new Date();
      console.log(`Calculating experience from ${resumeData.experience.length} positions`);
      
      resumeData.experience.forEach((exp: any, index: number) => {
        console.log(`Position ${index + 1}:`, {
          company: exp.company,
          role: exp.role,
          startDate: exp.startDate,
          endDate: exp.endDate,
          isCurrentRole: exp.isCurrentRole
        });
        
        if (exp.startDate) {
          console.log(`  Processing position ${index + 1} dates:`, {
            startDate: exp.startDate,
            startDateType: typeof exp.startDate,
            endDate: exp.endDate,
            endDateType: typeof exp.endDate,
            isCurrentRole: exp.isCurrentRole
          });

          // Handle various date formats
          let startDate: Date | null = null;
          let endDate: Date | null = null;

          // Parse start date
          if (exp.startDate instanceof Date) {
            startDate = exp.startDate;
          } else if (typeof exp.startDate === 'string') {
            // Handle different date string formats
            if (exp.startDate.match(/^\d{4}$/)) {
              // Just year like "2024"
              startDate = new Date(parseInt(exp.startDate), 0, 1);
            } else if (exp.startDate.match(/^\d{2}\/\d{4}$/)) {
              // MM/YYYY format
              const [month, year] = exp.startDate.split('/');
              startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            } else if (exp.startDate.match(/^\d{4}-\d{2}$/)) {
              // YYYY-MM format
              const [year, month] = exp.startDate.split('-');
              startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            } else {
              // Try to parse as normal date
              startDate = new Date(exp.startDate);
            }
          } else {
            console.log(`  Invalid startDate format for position ${index + 1}:`, exp.startDate);
            return; // Skip this iteration
          }

          if (!startDate) {
            console.log(`  Could not parse startDate for position ${index + 1}`);
            return;
          }

          // Parse end date
          if (exp.isCurrentRole) {
            endDate = now;
          } else if (exp.endDate) {
            if (exp.endDate instanceof Date) {
              endDate = exp.endDate;
            } else if (typeof exp.endDate === 'string') {
              // Handle different date string formats
              if (exp.endDate.match(/^\d{4}$/)) {
                endDate = new Date(parseInt(exp.endDate), 0, 1);
              } else if (exp.endDate.match(/^\d{2}\/\d{4}$/)) {
                const [month, year] = exp.endDate.split('/');
                endDate = new Date(parseInt(year), parseInt(month) - 1, 1);
              } else if (exp.endDate.match(/^\d{4}-\d{2}$/)) {
                const [year, month] = exp.endDate.split('-');
                endDate = new Date(parseInt(year), parseInt(month) - 1, 1);
              } else {
                endDate = new Date(exp.endDate);
              }
            } else {
              console.log(`  Invalid endDate format for position ${index + 1}:`, exp.endDate);
              endDate = now;
            }
          } else {
            endDate = now;
          }
          
          // Check if dates are valid
          if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            const yearsDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
            const yearsToAdd = Math.max(0, yearsDiff);
            totalYearsOfExperience += yearsToAdd;
            
            console.log(`  Years for this position: ${yearsToAdd.toFixed(1)} (${startDate.toDateString()} to ${endDate.toDateString()})`);
          } else {
            console.log(`  Invalid dates for position ${index + 1}: startDate=${startDate}, endDate=${endDate}`);
          }
        } else {
          console.log(`  No startDate for position ${index + 1}`);
        }
      });
    }
    
    console.log(`Total calculated experience: ${totalYearsOfExperience.toFixed(1)} years`);

    // Calculate resume-to-job match percentage using AI
    const matchAnalysis = await openai.chat.completions.create({
      model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: 'system',
          content: `You are an expert ATS and recruitment consultant with deep knowledge of modern hiring practices. Analyze the resume against the job description and provide a highly accurate match assessment.

IMPORTANT: The resume data includes calculated total years of experience: ${totalYearsOfExperience.toFixed(1)} years.

Calculate a precise match percentage based on these weighted criteria:
1. TECHNICAL SKILLS MATCH (35% weight):
   - Exact skill matches vs. required skills
   - Related/transferable skills proximity
   - Depth of experience with each skill
   - Advanced vs. basic skill level indicators

2. EXPERIENCE RELEVANCE (30% weight):
   - Years of experience vs. job requirements
   - Industry relevance and transferability
   - Role progression and career growth
   - Company size and type alignment
   - Direct vs. indirect experience relevance

3. ROLE & RESPONSIBILITY ALIGNMENT (20% weight):
   - Job function similarities
   - Leadership/management experience alignment
   - Project scale and complexity match
   - Team collaboration and individual contributor balance

4. EDUCATION & CERTIFICATIONS (10% weight):
   - Degree requirements vs. candidate education
   - Relevant certifications and training
   - Continuous learning indicators

5. CULTURAL & SOFT SKILLS FIT (5% weight):
   - Communication skills evidence
   - Problem-solving approach
   - Adaptability and learning mindset

SCORING GUIDELINES:
- 90-100%: Exceptional match, candidate exceeds most requirements
- 80-89%: Strong match, candidate meets all key requirements with some extras
- 70-79%: Good match, candidate meets most requirements, minor gaps
- 60-69%: Moderate match, candidate meets basic requirements, notable gaps
- 50-59%: Weak match, significant gaps in key requirements
- Below 50%: Poor match, major misalignment

Be more nuanced in scoring - avoid clustering around 70-80%. Use the full range appropriately.

For experience matching:
- Use the provided total years of experience: ${totalYearsOfExperience.toFixed(1)} years
- Compare against job requirements for experience level
- Consider the relevance of past roles to the target position

Return JSON with this exact structure:
{
  "matchPercentage": 85,
  "skillsMatch": {
    "matched": ["skill1", "skill2"],
    "missing": ["skill3", "skill4"],
    "percentage": 75
  },
  "experienceMatch": {
    "relevantYears": ${totalYearsOfExperience.toFixed(1)},
    "requiredYears": 3,
    "levelMatch": "Senior",
    "percentage": 90
  },
  "educationMatch": {
    "meetsRequirements": true,
    "percentage": 100
  },
  "keywordMatch": {
    "matched": ["keyword1", "keyword2"],
    "missing": ["keyword3"],
    "percentage": 80
  },
  "strengths": ["Strong technical background", "Relevant experience"],
  "gaps": ["Missing certification", "No cloud experience"],
  "recommendations": ["Add AWS certification", "Include cloud projects"],
  "improvementPotential": 95
}`,
        },
        {
          role: 'user',
          content: `Analyze this resume against the job description:

RESUME:
${JSON.stringify(resumeData, null, 2)}

JOB DESCRIPTION:
${jobDescription}

Provide detailed match analysis with actionable recommendations.`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const matchData = JSON.parse(matchAnalysis.choices[0].message.content || '{}');

    return NextResponse.json({
      success: true,
      matchAnalysis: matchData,
    });
  } catch (error) {
    console.error('Resume match analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze resume match' },
      { status: 500 }
    );
  }
}