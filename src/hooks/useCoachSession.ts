"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import type { MeAgentContext } from "@/types/interview";

export type CoachStatus = "idle" | "listening" | "thinking" | "responding";

function buildInstructions(
  ctx: MeAgentContext,
  codingProblemActive?: boolean,
): string {
  const lines = [
    ctx.companyName && `Company: ${ctx.companyName}`,
    ctx.roleTitle && `Role: ${ctx.roleTitle}`,
    ctx.jobDescription && `Job Description:\n${ctx.jobDescription}`,
    ctx.resumeSummary && `Candidate Resume:\n${ctx.resumeSummary}`,
    ctx.companyResearch && `Company Research:\n${ctx.companyResearch}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const isTechnical = ctx.mode === "technical";

  // Coding problem is on screen: coach gives only coding steps.
  if (codingProblemActive && isTechnical) {
    return `A CODING PROBLEM is currently on screen. The candidate is solving it. You hear the interviewer and the candidate.

Give ONLY short CODING STEPS the candidate can say or follow. No behavioral answers.

<candidate_background>
${lines}
</candidate_background>

CODING STEPS (adapt to what they're doing):
1. Clarify: inputs, outputs, edge cases, constraints.
2. Example: walk through a small example (input → output).
3. Approach: data structure(s) and algorithm in 1–2 sentences.
4. Complexity: time and space (e.g. O(n), O(n log n)).
5. Code outline: main steps or pseudocode.
6. Test: test with example and edge cases.

RULES:
- One short line per step. Use a simple list (1. ... 2. ...).
- Only include steps that fit the current moment (e.g. if they're coding, give approach/code/test).
- Respond as soon as the interviewer or candidate says something relevant.`;
  }

  if (isTechnical) {
    return `You are listening to a live technical/coding interview. You hear the interviewer (and sometimes a coding problem) and the candidate responding.

When the interviewer asks a question or presents a coding problem, give the candidate clear CODING STEPS — short, actionable steps they can say or follow while solving the problem.

<candidate_background>
${lines}
</candidate_background>

CODING STEPS TO SUGGEST (adapt to what was just asked):
1. Clarify: inputs, outputs, edge cases, constraints.
2. Example: walk through a small example (input → output).
3. Approach: data structure(s) and algorithm in 1–2 sentences.
4. Complexity: time and space (e.g. O(n), O(n log n)).
5. Code outline: main steps or pseudocode (optional, only if they're about to code).
6. Test: mention testing with the example or edge cases.

RULES:
- Output only the steps relevant to the current question (e.g. if they already clarified, skip to approach).
- Keep each step to one short line. Use a simple list (1. ... 2. ...).
- No long paragraphs. The candidate is under time pressure.
- When it's a behavioral or non-coding question, give a first-person answer using their resume instead of coding steps.
- When you hear a new question or problem, respond immediately with the right format (coding steps vs. answer).`;
  }

  return `You are listening to a live job interview through the candidate's microphone. You hear the interviewer asking questions and the candidate responding.

Your ONLY job: when the interviewer asks a question, immediately write the answer the candidate should give. Write it in first person as if YOU are the candidate.

<candidate_background>
${lines}
</candidate_background>

RULES:
- Write the ACTUAL ANSWER in first person ("I built...", "At my last role, I...").
- Pull from the candidate's real resume above. Mention specific companies, projects, technologies, and results.
- 3-6 sentences. Concise but substantive.
- Write it as natural speech. No bullet points, no markdown, no formatting.
- Do NOT give advice, tips, or feedback. JUST write the answer itself.
- When you hear a new question, write a new answer immediately.`;
}

function sendSessionUpdate(
  dc: RTCDataChannel,
  ctx: MeAgentContext,
  codingProblemActive: boolean,
) {
  if (dc.readyState !== "open") return;
  dc.send(
    JSON.stringify({
      type: "session.update",
      session: {
        type: "realtime",
        output_modalities: ["text"],
        instructions: buildInstructions(ctx, codingProblemActive),
        audio: {
          input: {
            transcription: { model: "gpt-4o-transcribe" },
            turn_detection: { type: "semantic_vad", eagerness: "high" },
          },
        },
      },
    }),
  );
}

export function useCoachSession() {
  const [coachStatus, setCoachStatus] = useState<CoachStatus>("idle");
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const contextRef = useRef<MeAgentContext | null>(null);
  const codingProblemActiveRef = useRef(false);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const textBuf = useRef("");
  const tsRef = useRef(0);

  const cleanup = useCallback(() => {
    if (dcRef.current) {
      try { dcRef.current.close(); } catch {}
      dcRef.current = null;
    }
    if (pcRef.current) {
      try { pcRef.current.close(); } catch {}
      pcRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
  }, []);

  const startCoach = useCallback(
    async ({
      context,
      interviewAudioEl,
    }: {
      context: MeAgentContext;
      interviewAudioEl?: HTMLAudioElement;
    }) => {
      if (pcRef.current) return;

      const res = await fetch("/api/session/coach", { method: "POST" });
      if (!res.ok) {
        console.error("[coach] session endpoint failed:", res.status);
        return;
      }
      const { ephemeralKey } = await res.json();
      if (!ephemeralKey) {
        console.error("[coach] no ephemeral key");
        return;
      }

      let audioStream: MediaStream;
      if (interviewAudioEl) {
        try {
          // captureStream() exists on HTMLMediaElement in browsers; DOM types may omit it
          const el = interviewAudioEl as HTMLMediaElement & { captureStream(): MediaStream };
          audioStream = el.captureStream();
        } catch (err) {
          console.error("[coach] captureStream failed:", err);
          return;
        }
      } else {
        try {
          audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: true,
            },
          });
        } catch (err) {
          console.error("[coach] mic denied:", err);
          return;
        }
      }
      audioStreamRef.current = audioStream;

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          console.error("[coach] peer connection", pc.connectionState);
          cleanup();
          setCoachStatus("idle");
        }
      };

      const sinkEl = document.createElement("audio");
      sinkEl.muted = true;
      pc.ontrack = (e) => {
        sinkEl.srcObject = e.streams[0];
      };

      audioStream.getAudioTracks().forEach((track) =>
        pc.addTrack(track, audioStream),
      );

      contextRef.current = context;
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        console.log("[coach] data channel open, sending session config");
        sendSessionUpdate(dc, context, codingProblemActiveRef.current);
        setCoachStatus("listening");
      };

      dc.onmessage = (event) => {
        let msg: { type: string; delta?: string; text?: string; [k: string]: unknown };
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        if (msg.type === "session.created" || msg.type === "session.updated") {
          console.log("[coach]", msg.type);
        } else if (msg.type === "response.created") {
          textBuf.current = "";
          tsRef.current = Date.now();
          setCoachStatus("thinking");
          window.dispatchEvent(
            new CustomEvent("coach:suggestion", {
              detail: { response: "", timestamp: tsRef.current, streaming: true },
            }),
          );
        } else if (msg.type === "response.output_text.delta") {
          textBuf.current += msg.delta ?? "";
          setCoachStatus("responding");
          window.dispatchEvent(
            new CustomEvent("coach:suggestion", {
              detail: {
                response: textBuf.current,
                timestamp: tsRef.current,
                streaming: true,
              },
            }),
          );
        } else if (
          msg.type === "response.output_text.done" ||
          msg.type === "response.done"
        ) {
          if (textBuf.current) {
            window.dispatchEvent(
              new CustomEvent("coach:suggestion", {
                detail: {
                  response: textBuf.current,
                  timestamp: tsRef.current,
                  streaming: false,
                },
              }),
            );
          }
          setCoachStatus("listening");
        } else if (msg.type === "error") {
          const e = msg.error as { message?: string; type?: string; code?: string } | undefined;
          console.error("[coach] error:", e?.message, e?.type, e?.code);
        } else if (
          msg.type !== "input_audio_buffer.speech_started" &&
          msg.type !== "input_audio_buffer.speech_stopped" &&
          msg.type !== "input_audio_buffer.committed"
        ) {
          console.log("[coach] event:", msg.type);
        }
      };

      dc.onclose = () => {
        console.log("[coach] data channel closed");
      };

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const sdpRes = await fetch(
          "https://api.openai.com/v1/realtime/calls",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${ephemeralKey}`,
              "Content-Type": "application/sdp",
            },
            body: offer.sdp,
          },
        );

        if (!sdpRes.ok) {
          const errText = await sdpRes.text();
          console.error("[coach] SDP exchange failed:", sdpRes.status, errText);
          cleanup();
          setCoachStatus("idle");
          return;
        }

        const answerSdp = await sdpRes.text();
        await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
        console.log("[coach] WebRTC connected");
      } catch (err) {
        console.error("[coach] connection failed:", err);
        cleanup();
        setCoachStatus("idle");
      }
    },
    [cleanup],
  );

  const regenerate = useCallback(() => {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    dc.send(JSON.stringify({ type: "response.create" }));
  }, []);

  const sendTranscript = useCallback(
    (role: "interviewer" | "candidate", text: string) => {
      const dc = dcRef.current;
      if (!dc || dc.readyState !== "open") return;

      const label = role === "interviewer" ? "Interviewer" : "Candidate";
      dc.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [{ type: "input_text", text: `[${label}]: ${text}` }],
          },
        }),
      );

      if (role === "interviewer") {
        dc.send(JSON.stringify({ type: "response.create" }));
      }
    },
    [],
  );

  const setCodingProblemActive = useCallback((active: boolean) => {
    codingProblemActiveRef.current = active;
    const dc = dcRef.current;
    const ctx = contextRef.current;
    if (dc?.readyState === "open" && ctx) {
      sendSessionUpdate(dc, ctx, active);
    }
  }, []);

  const stopCoach = useCallback(async () => {
    contextRef.current = null;
    codingProblemActiveRef.current = false;
    cleanup();
    setCoachStatus("idle");
  }, [cleanup]);

  useEffect(() => () => { cleanup(); }, [cleanup]);

  return { startCoach, stopCoach, coachStatus, sendTranscript, regenerate, setCodingProblemActive };
}
