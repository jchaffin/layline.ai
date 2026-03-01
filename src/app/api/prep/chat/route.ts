import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, resumeData, jobData, context } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const resumeContext = resumeData ? `
      User's Background:
      - Experience: ${resumeData.experience?.map((exp: { title?: string; company?: string; duration?: string; role?: string }) => `${exp.title ?? exp.role ?? 'Role'} at ${exp.company ?? 'Company'} (${exp.duration ?? ''})`).join('; ') || 'Not specified'}
      - Technical Skills: ${resumeData.skills?.technical?.join(', ') || 'Not specified'}
      - Education: ${resumeData.education?.map((edu: { degree?: string; institution?: string }) => `${edu.degree} from ${edu.institution}`).join('; ') || 'Not specified'}
      - Industry: ${resumeData.experience?.[0]?.company || 'Not specified'}
    ` : '';

    const jobContext = jobData ? `
      Target Role:
      - Position: ${jobData.title || 'Not specified'}
      - Company: ${jobData.company || 'Not specified'}
      - Industry: ${jobData.industry || 'Not specified'}
      - Key Requirements: ${jobData.requirements?.join(', ') || 'Not specified'}
      - Preferred Skills: ${jobData.preferredSkills?.join(', ') || 'Not specified'}
    ` : '';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: 'system',
          content: `You are an expert interview coach and career advisor. Help users prepare for interviews by providing:

1. **Interview Strategy**: Advice on how to approach different types of questions
2. **Company Research**: Guidance on researching companies and roles
3. **Answer Frameworks**: Help structuring responses (STAR method, etc.)
4. **Confidence Building**: Encouragement and practical tips
5. **Industry Insights**: Specific advice for their target industry/role

Your responses should be:
- Practical and actionable
- Tailored to their background and target role
- Encouraging but realistic
- Specific rather than generic
- Focused on interview success

Keep responses concise (2-3 paragraphs max) while being comprehensive.`,
        },
        {
          role: 'user',
          content: `${message}

${resumeContext}

${jobContext}

Please provide specific, actionable advice tailored to my background and target role.`,
        },
      ],
    });

    const assistantResponse = response.choices[0].message.content;

    return NextResponse.json({
      success: true,
      response: assistantResponse,
    });
  } catch (error) {
    console.error('Error in prep chat:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}