export interface CoachSessionConfig {
  openaiApiKey: string;
}

export async function createCoachSessionKey(
  config: CoachSessionConfig,
): Promise<{ ephemeralKey: string }> {
  const response = await fetch(
    "https://api.openai.com/v1/realtime/client_secrets",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expires_after: { anchor: "created_at", seconds: 600 },
        session: {
          type: "realtime",
          model: "gpt-realtime",
          audio: {
            input: {
              transcription: { model: "gpt-4o-transcribe" },
            },
          },
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  if (!data.value) {
    throw new Error("Invalid response from OpenAI — missing ephemeral key");
  }

  return { ephemeralKey: data.value };
}
