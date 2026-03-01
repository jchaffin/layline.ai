import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { type, resumeData, jobData } = await request.json();

    if (!type) {
      return NextResponse.json(
        { error: 'Question type is required' },
        { status: 400 }
      );
    }

    const questionPrompts = {
      behavioral: `Generate a behavioral interview question using the STAR method. Focus on past experiences, challenges overcome, and achievements. Make it relevant to the candidate's background and the target role.`,
      technical: `Generate a technical interview question appropriate for the role and industry. Include problem-solving scenarios, technical knowledge assessment, or system design questions.`,
      situational: `Generate a situational interview question presenting a hypothetical workplace scenario. Focus on decision-making, leadership, and problem-solving in challenging situations.`,
      'company-specific': `Generate a company and role-specific question about culture fit, motivation, and understanding of the company's mission and values.`
    };

    const resumeContext = resumeData ? `
      Candidate Background:
      - Experience: ${resumeData.experience?.map((exp: { title?: string; company?: string }) => `${exp.title} at ${exp.company}`).join(', ') || 'Not specified'}
      - Skills: ${resumeData.skills?.technical?.join(', ') || 'Not specified'}
      - Education: ${resumeData.education?.map((edu: { degree?: string; institution?: string }) => `${edu.degree} from ${edu.institution}`).join(', ') || 'Not specified'}
    ` : '';

    const jobContext = jobData ? `
      Target Role:
      - Position: ${jobData.title || 'Not specified'}
      - Company: ${jobData.company || 'Not specified'}
      - Key Requirements: ${jobData.requirements?.join(', ') || 'Not specified'}
      - Industry: ${jobData.industry || 'Not specified'}
    ` : '';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: 'system',
          content: `You are an expert interview coach. Generate realistic, challenging interview questions that help candidates prepare effectively for their target roles.

${questionPrompts[type as keyof typeof questionPrompts]}

Provide a single, well-crafted question that:
1. Is appropriate for the candidate's experience level
2. Relates to the target role and industry
3. Challenges the candidate to demonstrate relevant skills
4. Is realistic and commonly asked in interviews

Return only the question text, no additional formatting or explanation.`,
        },
        {
          role: 'user',
          content: `Generate a ${type} interview question for this candidate:

${resumeContext}

${jobContext}

Make the question specific and relevant to their background and target role.`,
        },
      ],
    });

    const question = response.choices[0].message.content?.trim();

    return NextResponse.json({
      success: true,
      question,
      type,
    });
  } catch (error) {
    console.error('Error generating interview question:', error);
    return NextResponse.json(
      { error: 'Failed to generate interview question' },
      { status: 500 }
    );
  }
}