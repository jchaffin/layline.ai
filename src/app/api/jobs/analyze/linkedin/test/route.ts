import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    console.log('Testing LinkedIn extraction for URL:', url);
    
    // Call the LinkedIn extraction API
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/jobs/extract-linkedin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url: url,
        jobTitle: "AI Product Engineer, Mid-Level"
      }),
    });

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      result: data,
      testUrl: url
    });
    
  } catch (error) {
    console.error('Test LinkedIn extraction error:', error);
    return NextResponse.json(
      { error: 'Test failed' },
      { status: 500 }
    );
  }
}

