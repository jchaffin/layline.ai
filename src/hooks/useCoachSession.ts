"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import {
  RealtimeSession,
  RealtimeAgent,
  OpenAIRealtimeWebRTC,
} from "@openai/agents/realtime";
import type { MeAgentContext } from "@/types/interview";

export type CoachStatus = "idle" | "listening" | "thinking" | "responding";

interface CoachSessionOptions {
  context: MeAgentContext;
  audioElement: HTMLAudioElement | null;
}

function buildInstructions(ctx: MeAgentContext): string {
  const lines = [
    ctx.companyName && `Company: ${ctx.companyName}`,
    ctx.roleTitle && `Role: ${ctx.roleTitle}`,
    ctx.jobDescription && `Job Description:\n${ctx.jobDescription}`,
    ctx.resumeSummary && `Candidate Resume:\n${ctx.resumeSummary}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `You are a live interview coach.\n\n${lines}`;
}

export function useCoachSession() {
  const [coachStatus, setCoachStatus] = useState<CoachStatus>("idle");
  const sessionRef = useRef<RealtimeSession | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCoach = useCallback(
    async ({ context, audioElement }: CoachSessionOptions) => {
      if (sessionRef.current || !audioElement) return;

      const res = await fetch("/api/session/coach", { method: "POST" });
      if (!res.ok) return;
      const { ephemeralKey } = await res.json();
      if (!ephemeralKey) return;

      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const dest = audioCtx.createMediaStreamDestination();

      if (audioElement.srcObject) {
        audioCtx.createMediaStreamSource(audioElement.srcObject as MediaStream).connect(dest);
      } else {
        await new Promise<void>((resolve) => {
          const handler = () => {
            if (audioElement.srcObject) {
              audioCtx.createMediaStreamSource(audioElement.srcObject as MediaStream).connect(dest);
            }
            audioElement.removeEventListener("loadedmetadata", handler);
            resolve();
          };
          audioElement.addEventListener("loadedmetadata", handler);
        });
      }

      streamRef.current = dest.stream;

      const agent = new RealtimeAgent({
        name: "InterviewCoach",
        instructions: buildInstructions(context),
        tools: [],
      });

      const session = new RealtimeSession(agent, {
        transport: new OpenAIRealtimeWebRTC({ mediaStream: dest.stream }),
        model: "gpt-realtime",
        config: {
          modalities: ["text"] as any,
          inputAudioTranscription: {
            model: "gpt-4o-transcribe",
            language: "en",
          },
        },
      });

      sessionRef.current = session;
      setCoachStatus("listening");

      let text = "";
      let id = 0;

      session.on("transport_event", (event: Record<string, unknown>) => {
        const t = event.type as string;
        if (t === "input_audio_buffer.speech_started") setCoachStatus("listening");
        if (t === "input_audio_buffer.speech_stopped") setCoachStatus("thinking");
        if (t === "response.created") setCoachStatus("thinking");

        const isDelta =
          t === "response.text.delta" ||
          t === "response.audio_transcript.delta" ||
          t === "response.output_audio_transcript.delta";

        const isDone =
          t === "response.text.done" ||
          t === "response.audio_transcript.done" ||
          t === "response.output_audio_transcript.done" ||
          t === "response.done";

        if (isDelta) {
          setCoachStatus("responding");
          if (!text) id = Date.now();
          text += (event.delta as string) || "";
          window.dispatchEvent(
            new CustomEvent("coach:suggestion", {
              detail: { response: text, timestamp: id, streaming: true },
            }),
          );
        }

        if (isDone && text.trim()) {
          window.dispatchEvent(
            new CustomEvent("coach:suggestion", {
              detail: { response: text.trim(), timestamp: id, streaming: false },
            }),
          );
          text = "";
          setCoachStatus("listening");
        }
      });

      try {
        await session.connect({ apiKey: ephemeralKey });
      } catch (err) {
        console.error("Coach connection failed:", err);
        try { session.close(); } catch {}
        sessionRef.current = null;
        setCoachStatus("idle");
      }
    },
    [],
  );

  const stopCoach = useCallback(async () => {
    if (sessionRef.current) {
      try { await sessionRef.current.close(); } catch {}
      sessionRef.current = null;
    }
    if (audioCtxRef.current) {
      try { await audioCtxRef.current.close(); } catch {}
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCoachStatus("idle");
  }, []);

  useEffect(() => () => { stopCoach(); }, []);

  return { startCoach, stopCoach, coachStatus };
}
