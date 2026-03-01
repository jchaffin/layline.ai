import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  switch (action) {
    case 'websocket':
      return handleWebSocket(request);
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  switch (action) {
    case 'generate-questions':
      return handleGenerateQuestions(body);
    case 'generate-suggestions':
      return handleGenerateSuggestions(body);
    case 'generate-followup':
      return handleGenerateFollowup(body);
    case 'transcribe':
      return handleTranscribe(body);
    case 'speech':
      return handleSpeech(body);
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}

// Handler functions
async function handleWebSocket(request: NextRequest) {
  // Placeholder for websocket logic
  return NextResponse.json({ websocket: 'connected' });
}

async function handleGenerateQuestions(body: any) {
  // Placeholder for generate-questions logic
  return NextResponse.json({ questions: [] });
}

async function handleGenerateSuggestions(body: any) {
  // Placeholder for generate-suggestions logic
  return NextResponse.json({ suggestions: [] });
}

async function handleGenerateFollowup(body: any) {
  // Placeholder for generate-followup logic
  return NextResponse.json({ followup: {} });
}

async function handleTranscribe(body: any) {
  // Placeholder for transcribe logic
  return NextResponse.json({ transcription: {} });
}

async function handleSpeech(body: any) {
  try {
    const { text } = body;
    
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 });
    }

    // ElevenLabs API endpoint for text-to-speech using default voice
    const voiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel - ElevenLabs default voice
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
    }

    const audioBuffer = await response.arrayBuffer();
    
    return new NextResponse(audioBuffer as BodyInit, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Speech generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 